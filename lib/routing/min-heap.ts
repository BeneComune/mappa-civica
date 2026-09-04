// lib\routing\min-heap.ts
// Binary min-heap keyed on cost, used as Dijkstra's priority queue.

import type { NodeId } from "./types"

export class MinHeap {
  private items: Array<{ node: NodeId; cost: number }> = []

  push(item: { node: NodeId; cost: number }): void {
    this.items.push(item)
    this.bubbleUp(this.items.length - 1)
  }

  pop(): { node: NodeId; cost: number } | undefined {
    if (this.items.length === 0) {
      return undefined
    }

    const top = this.items[0]
    const last = this.items.pop()

    if (this.items.length > 0 && last) {
      this.items[0] = last
      this.bubbleDown(0)
    }

    return top
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.items[parent].cost <= this.items[index].cost) {
        break
      }

      ;[this.items[parent], this.items[index]] = [this.items[index], this.items[parent]]
      index = parent
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = index * 2 + 1
      const right = left + 1
      let smallest = index

      if (left < this.items.length && this.items[left].cost < this.items[smallest].cost) {
        smallest = left
      }

      if (right < this.items.length && this.items[right].cost < this.items[smallest].cost) {
        smallest = right
      }

      if (smallest === index) {
        break
      }

      ;[this.items[smallest], this.items[index]] = [this.items[index], this.items[smallest]]
      index = smallest
    }
  }
}
