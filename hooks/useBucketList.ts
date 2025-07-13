"use client"

import { useState, useEffect, useCallback } from "react"
import { traceAsync, traceSync, traceUserAction } from "@/lib/tracing"

export interface BucketListItem {
  id: string
  title: string
  description: string
  category: string
  deadline?: string
  progress: number
  completed: boolean
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "bucketListItems"

export function useBucketList() {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load items with tracing
  const loadItems = useCallback(() => {
    return traceAsync(
      "bucket_list.load_items",
      async () => {
        setIsLoading(true)

        // Simulate async for better tracing
        await new Promise((resolve) => setTimeout(resolve, 10))

        const savedItems = localStorage.getItem(STORAGE_KEY)

        if (savedItems) {
          const parsedItems = JSON.parse(savedItems)
          setItems(parsedItems)
          return parsedItems
        }

        return []
      },
      {
        "storage.operation": "read",
        "storage.key": STORAGE_KEY,
      },
    )
      .catch((error) => {
        setError("Failed to load items")
        throw error
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Save items with tracing
  const saveItems = useCallback((newItems: BucketListItem[]) => {
    return traceSync(
      "bucket_list.save_items",
      () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
        return true
      },
      {
        "storage.operation": "write",
        "storage.key": STORAGE_KEY,
        "items.count": newItems.length,
      },
    )
  }, [])

  // Add item with tracing
  const addItem = useCallback(
    (itemData: Omit<BucketListItem, "id" | "createdAt" | "updatedAt">) => {
      return traceSync(
        "bucket_list.add_item",
        () => {
          const newItem: BucketListItem = {
            ...itemData,
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          traceUserAction("add_bucket_list_item", {
            "item.category": newItem.category,
            "item.has_deadline": !!newItem.deadline,
            "item.initial_progress": newItem.progress,
          })

          const updatedItems = [...items, newItem]
          setItems(updatedItems)
          saveItems(updatedItems)

          return newItem
        },
        {
          "item.category": itemData.category,
          "item.has_deadline": !!itemData.deadline,
        },
      )
    },
    [items, saveItems],
  )

  // Update item with tracing
  const updateItem = useCallback(
    (id: string, updates: Partial<BucketListItem>) => {
      return traceSync(
        "bucket_list.update_item",
        () => {
          const existingItem = items.find((item) => item.id === id)
          if (!existingItem) {
            throw new Error(`Item with id ${id} not found`)
          }

          traceUserAction("update_bucket_list_item", {
            "item.id": id,
            "item.category": existingItem.category,
            "update.fields": Object.keys(updates).join(","),
          })

          const updatedItems = items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
          )

          setItems(updatedItems)
          saveItems(updatedItems)

          return updatedItems.find((item) => item.id === id)
        },
        {
          "item.id": id,
          "update.field_count": Object.keys(updates).length,
        },
      )
    },
    [items, saveItems],
  )

  // Delete item with tracing
  const deleteItem = useCallback(
    (id: string) => {
      return traceSync(
        "bucket_list.delete_item",
        () => {
          const itemToDelete = items.find((item) => item.id === id)
          if (!itemToDelete) {
            throw new Error(`Item with id ${id} not found`)
          }

          traceUserAction("delete_bucket_list_item", {
            "item.id": id,
            "item.category": itemToDelete.category,
            "item.was_completed": itemToDelete.completed,
          })

          const updatedItems = items.filter((item) => item.id !== id)
          setItems(updatedItems)
          saveItems(updatedItems)

          return true
        },
        {
          "item.id": id,
        },
      )
    },
    [items, saveItems],
  )

  // Toggle completion with tracing
  const toggleComplete = useCallback(
    (id: string) => {
      const item = items.find((item) => item.id === id)
      if (!item) return null

      const newCompletedStatus = !item.completed

      traceUserAction("toggle_completion", {
        "item.id": id,
        "item.category": item.category,
        "completion.new_status": newCompletedStatus,
      })

      return updateItem(id, {
        completed: newCompletedStatus,
        progress: newCompletedStatus ? 100 : item.progress,
      })
    },
    [items, updateItem],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load items on mount
  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Calculate stats
  const stats = {
    total: items.length,
    completed: items.filter((item) => item.completed).length,
    overdue: items.filter((item) => item.deadline && new Date(item.deadline) < new Date() && !item.completed).length,
    averageProgress: items.length > 0 ? items.reduce((sum, item) => sum + item.progress, 0) / items.length : 0,
  }

  return {
    items,
    isLoading,
    error,
    stats,
    addItem,
    updateItem,
    deleteItem,
    toggleComplete,
    clearError,
  }
}
