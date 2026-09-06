"""Utilities to sample a DEM and derive line slope values."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.ndimage import map_coordinates
from shapely.geometry import LineString
from tifffile import TiffFile


SLOPE_CLASSES = [
    (0, 3, '0-3: flat'),
    (3, 5, '3-5: mild'),
    (5, 8, '5-8: medium'),
    (8, 10, '8-10: hard'),
    (10, 20, '10-20: extreme'),
    (20, float('inf'), '>20: impossible'),
]


@dataclass
class DemSampler:
    array: np.ndarray
    x0: float
    y0: float
    pixel_size: float
    nodata: float

    @classmethod
    def from_file(cls, path: Path) -> 'DemSampler':
        with TiffFile(path) as tif:
            page = tif.pages[0]
            array = page.asarray().astype(np.float32)
            scale_x, scale_y, _ = page.tags['ModelPixelScaleTag'].value
            _, _, _, x0, y0, _ = page.tags['ModelTiepointTag'].value
            nodata = float(page.tags['GDAL_NODATA'].value)

        if abs(scale_x - scale_y) > 1e-6:
            raise ValueError('DEM pixel size non quadrata non supportata')

        return cls(array=array, x0=float(x0), y0=float(y0), pixel_size=float(scale_x), nodata=nodata)

    def sample(self, coords: np.ndarray) -> np.ndarray:
        cols = (coords[:, 0] - self.x0) / self.pixel_size
        rows = (self.y0 - coords[:, 1]) / self.pixel_size

        values = np.where(self.array == self.nodata, 0.0, self.array)
        valid = (self.array != self.nodata).astype(np.float32)

        sampled_values = map_coordinates(values, [rows, cols], order=1, mode='nearest')
        sampled_valid = map_coordinates(valid, [rows, cols], order=1, mode='nearest')

        nearest_rows = np.clip(np.rint(rows).astype(int), 0, self.array.shape[0] - 1)
        nearest_cols = np.clip(np.rint(cols).astype(int), 0, self.array.shape[1] - 1)
        nearest = self.array[nearest_rows, nearest_cols]

        elevations = np.where(sampled_valid >= 0.5, sampled_values, nearest)
        elevations = np.where(elevations == self.nodata, np.nan, elevations)
        return elevations


def slope_class_for_value(slope: float) -> str:
    for minimum, maximum, label in SLOPE_CLASSES:
        if minimum <= slope < maximum:
            return label
    return '>20: impossible'


def compute_line_slope(line: LineString, dem: DemSampler, sample_step_m: float = 10.0) -> float:
    length = float(line.length)
    if length <= 0:
        return 0.0

    sample_count = max(2, int(np.ceil(length / sample_step_m)) + 1)
    distances = np.linspace(0.0, length, sample_count)
    coords = np.array([[line.interpolate(distance).x, line.interpolate(distance).y] for distance in distances], dtype=np.float64)
    elevations = dem.sample(coords)

    valid = np.isfinite(elevations)

    if np.count_nonzero(valid) < 2:
        return 0.0

    # Use a best-fit gradient instead of summing every up/down wiggle.
    slope_m_per_m = float(np.polyfit(distances[valid], elevations[valid], 1)[0])
    return abs(slope_m_per_m) * 100.0


def compute_line_grade(line: LineString, dem: DemSampler) -> float:
    length = float(line.length)
    if length <= 0:
        return 0.0

    start = np.array([[line.coords[0][0], line.coords[0][1]]], dtype=np.float64)
    end = np.array([[line.coords[-1][0], line.coords[-1][1]]], dtype=np.float64)
    elevations = dem.sample(np.vstack([start, end]))

    if not np.all(np.isfinite(elevations)):
        return 0.0

    return ((float(elevations[-1]) - float(elevations[0])) / length) * 100.0


def enrich_geodataframe_with_slope(gdf, dem: DemSampler, geometry_column: str = 'geometry'):
    slopes = []
    grades = []
    slope_classes = []

    for geom in gdf[geometry_column]:
        if geom is None or geom.is_empty or geom.geom_type != 'LineString':
          slopes.append(0.0)
          grades.append(0.0)
          slope_classes.append(slope_class_for_value(0.0))
          continue

        slope = compute_line_slope(geom, dem)
        grade = compute_line_grade(geom, dem)
        slopes.append(slope)
        grades.append(grade)
        slope_classes.append(slope_class_for_value(slope))

    enriched = gdf.copy()
    enriched['slope'] = slopes
    enriched['grade'] = grades
    enriched['slope_class'] = slope_classes
    return enriched
