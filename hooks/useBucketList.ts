"use client"

import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger"

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

  // Load items from localStorage
  const loadItems = useCallback(() => {
    try {
      logger.debug("Loading bucket list items from localStorage", {
        component: "useBucketList",
        action: "loadItems",
      })

      setIsLoading(true)
      const savedItems = localStorage.getItem(STORAGE_KEY)

      if (savedItems) {
        const parsedItems = JSON.parse(savedItems)
        setItems(parsedItems)

        logger.info("Successfully loaded bucket list items", {
          component: "useBucketList",
          action: "loadItems",
          itemCount: parsedItems.length,
        })
      } else {
        logger.info("No existing bucket list items found", {
          component: "useBucketList",
          action: "loadItems",
        })
      }
    } catch (error) {
      const errorMessage = "Failed to load bucket list items from localStorage"
      logger.error(
        errorMessage,
        {
          component: "useBucketList",
          action: "loadItems",
        },
        error as Error,
      )

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save items to localStorage
  const saveItems = useCallback((newItems: BucketListItem[]) => {
    try {
      logger.debug("Saving bucket list items to localStorage", {
        component: "useBucketList",
        action: "saveItems",
        itemCount: newItems.length,
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))

      logger.info("Successfully saved bucket list items", {
        component: "useBucketList",
        action: "saveItems",
        itemCount: newItems.length,
      })
    } catch (error) {
      const errorMessage = "Failed to save bucket list items to localStorage"
      logger.error(
        errorMessage,
        {
          component: "useBucketList",
          action: "saveItems",
        },
        error as Error,
      )

      setError(errorMessage)
    }
  }, [])

  // Add new item
  const addItem = useCallback(
    (itemData: Omit<BucketListItem, "id" | "createdAt" | "updatedAt">) => {
      try {
        const newItem: BucketListItem = {
          ...itemData,
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        logger.logUserAction("add_bucket_list_item", {
          itemId: newItem.id,
          category: newItem.category,
          title: newItem.title,
          hasDeadline: !!newItem.deadline,
          initialProgress: newItem.progress,
        })

        const updatedItems = [...items, newItem]
        setItems(updatedItems)
        saveItems(updatedItems)

        logger.info("Successfully added new bucket list item", {
          component: "useBucketList",
          action: "addItem",
          itemId: newItem.id,
          category: newItem.category,
        })

        return newItem
      } catch (error) {
        const errorMessage = "Failed to add new bucket list item"
        logger.error(
          errorMessage,
          {
            component: "useBucketList",
            action: "addItem",
          },
          error as Error,
        )

        setError(errorMessage)
        return null
      }
    },
    [items, saveItems],
  )

  // Update existing item
  const updateItem = useCallback(
    (id: string, updates: Partial<BucketListItem>) => {
      try {
        const existingItem = items.find((item) => item.id === id)
        if (!existingItem) {
          throw new Error(`Item with id ${id} not found`)
        }

        logger.logUserAction("update_bucket_list_item", {
          itemId: id,
          category: existingItem.category,
          updatedFields: Object.keys(updates),
          progressChange: updates.progress !== undefined ? updates.progress - existingItem.progress : undefined,
        })

        const updatedItems = items.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
        )

        setItems(updatedItems)
        saveItems(updatedItems)

        logger.info("Successfully updated bucket list item", {
          component: "useBucketList",
          action: "updateItem",
          itemId: id,
          updatedFields: Object.keys(updates),
        })

        return updatedItems.find((item) => item.id === id)
      } catch (error) {
        const errorMessage = `Failed to update bucket list item: ${id}`
        logger.error(
          errorMessage,
          {
            component: "useBucketList",
            action: "updateItem",
            itemId: id,
          },
          error as Error,
        )

        setError(errorMessage)
        return null
      }
    },
    [items, saveItems],
  )

  // Delete item
  const deleteItem = useCallback(
    (id: string) => {
      try {
        const itemToDelete = items.find((item) => item.id === id)
        if (!itemToDelete) {
          throw new Error(`Item with id ${id} not found`)
        }

        logger.logUserAction("delete_bucket_list_item", {
          itemId: id,
          category: itemToDelete.category,
          title: itemToDelete.title,
          wasCompleted: itemToDelete.completed,
        })

        const updatedItems = items.filter((item) => item.id !== id)
        setItems(updatedItems)
        saveItems(updatedItems)

        logger.info("Successfully deleted bucket list item", {
          component: "useBucketList",
          action: "deleteItem",
          itemId: id,
          category: itemToDelete.category,
        })

        return true
      } catch (error) {
        const errorMessage = `Failed to delete bucket list item: ${id}`
        logger.error(
          errorMessage,
          {
            component: "useBucketList",
            action: "deleteItem",
            itemId: id,
          },
          error as Error,
        )

        setError(errorMessage)
        return false
      }
    },
    [items, saveItems],
  )

  // Toggle completion status
  const toggleComplete = useCallback(
    (id: string) => {
      try {
        const item = items.find((item) => item.id === id)
        if (!item) {
          throw new Error(`Item with id ${id} not found`)
        }

        const newCompletedStatus = !item.completed
        const updates = {
          completed: newCompletedStatus,
          progress: newCompletedStatus ? 100 : item.progress,
        }

        logger.logUserAction("toggle_bucket_list_item_completion", {
          itemId: id,
          category: item.category,
          title: item.title,
          newStatus: newCompletedStatus ? "completed" : "incomplete",
          progressSet: updates.progress,
        })

        return updateItem(id, updates)
      } catch (error) {
        const errorMessage = `Failed to toggle completion for item: ${id}`
        logger.error(
          errorMessage,
          {
            component: "useBucketList",
            action: "toggleComplete",
            itemId: id,
          },
          error as Error,
        )

        setError(errorMessage)
        return null
      }
    },
    [items, updateItem],
  )

  // Clear error
  const clearError = useCallback(() => {
    logger.debug("Clearing error state", {
      component: "useBucketList",
      action: "clearError",
    })
    setError(null)
  }, [])

  // Load items on mount
  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Calculate statistics
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
