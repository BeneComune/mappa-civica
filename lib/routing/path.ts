// lib\routing\path.ts
// Snapping input points to graph nodes, and the Dijkstra search between them.

import type { Coord, NodeId, RoutingGraph, RoutingInputPoint, RoutingMode } from "./types"
import { distanceMeters } from "./geo"
import { edgeTravelTimeMinutes } from "./cost"
import { MinHeap } from "./min-heap"

export function findNearestNodeId(graph: RoutingGraph, point: RoutingInputPoint): NodeId | null {
  let bestId: NodeId | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  const target: Coord = [point.lng, point.lat]

  for (const candidate of graph.nodeCoords) {
    const currentDistance = distanceMeters(target, candidate.coord)
    if (currentDistance < bestDistance) {
      bestDistance = currentDistance
      bestId = candidate.id
    }
  }

  return bestId
}

export function shortestPath(
  graph: RoutingGraph,
  startId: NodeId,
  endId: NodeId,
  mode: RoutingMode
): { nodePath: NodeId[]; edgePath: number[] } | null {
  const distances = new Map<NodeId, number>()
  const previousNode = new Map<NodeId, NodeId>()
  const previousEdge = new Map<NodeId, number>()
  const queue = new MinHeap()

  distances.set(startId, 0)
  queue.push({ node: startId, cost: 0 })

  while (true) {
    const current = queue.pop()
    if (!current) {
      break
    }

    const knownDistance = distances.get(current.node)
    if (knownDistance !== undefined && current.cost > knownDistance) {
      continue
    }

    if (current.node === endId) {
      break
    }

    const node = graph.nodes.get(current.node)
    if (!node) {
      continue
    }

    for (const edgeIndex of node.edges) {
      const edge = graph.edges[edgeIndex]
      const neighbor = edge.from === current.node ? edge.to : edge.from
      const nextCost = current.cost + edgeTravelTimeMinutes(edge, mode, current.node)
      const previousBest = distances.get(neighbor)

      if (previousBest !== undefined && previousBest <= nextCost) {
        continue
      }

      distances.set(neighbor, nextCost)
      previousNode.set(neighbor, current.node)
      previousEdge.set(neighbor, edgeIndex)
      queue.push({ node: neighbor, cost: nextCost })
    }
  }

  if (!distances.has(endId)) {
    return null
  }

  const nodePath = [endId]
  const edgePath: number[] = []
  let current: NodeId = endId

  while (current !== startId) {
    const prevNode = previousNode.get(current)
    const prevEdge = previousEdge.get(current)
    if (prevNode === undefined || prevEdge === undefined) {
      return null
    }

    nodePath.push(prevNode)
    edgePath.push(prevEdge)
    current = prevNode
  }

  nodePath.reverse()
  edgePath.reverse()
  return { nodePath, edgePath }
}

export function appendSegmentCoordinates(
  coordinates: Coord[],
  segment: Coord[],
  reverse: boolean
): Coord[] {
  const segmentCoordinates = reverse ? [...segment].reverse() : segment
  if (coordinates.length === 0) {
    return [...segmentCoordinates]
  }

  const merged = [...coordinates]
  for (const coordinate of segmentCoordinates) {
    const last = merged[merged.length - 1]
    if (!last || last[0] !== coordinate[0] || last[1] !== coordinate[1]) {
      merged.push(coordinate)
    }
  }

  return merged
}
