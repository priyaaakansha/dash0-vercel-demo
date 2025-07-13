"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit2, Trash2, Target, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { useBucketList, type BucketListItem } from "@/hooks/useBucketList"
import { traceUserAction } from "@/lib/tracing"

const categories = [
  { value: "travel", label: "Travel", color: "bg-pink-100 text-pink-800" },
  { value: "career", label: "Career", color: "bg-blue-100 text-blue-800" },
  { value: "fitness", label: "Fitness", color: "bg-green-100 text-green-800" },
  { value: "personal", label: "Personal", color: "bg-purple-100 text-purple-800" },
  { value: "family", label: "Family", color: "bg-orange-100 text-orange-800" },
  { value: "learning", label: "Learning", color: "bg-yellow-100 text-yellow-800" },
  { value: "creative", label: "Creative", color: "bg-indigo-100 text-indigo-800" },
  { value: "adventure", label: "Adventure", color: "bg-teal-100 text-teal-800" },
]

export default function BucketListApp() {
  const { items, isLoading, error, stats, addItem, updateItem, deleteItem, toggleComplete, clearError } =
    useBucketList()

  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    deadline: "",
    progress: 0,
  })

  // Trace component mount
  useEffect(() => {
    traceUserAction("page_load", {
      "page.name": "bucket_list",
    })
  }, [])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      deadline: "",
      progress: 0,
    })
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    traceUserAction("form_submit", {
      "form.type": editingItem ? "edit" : "create",
      "form.category": formData.category,
    })

    try {
      if (editingItem) {
        updateItem(editingItem.id, {
          ...formData,
          completed: formData.progress === 100,
        })
      } else {
        addItem({
          ...formData,
          completed: formData.progress === 100,
        })
      }

      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Form submission failed:", error)
    }
  }

  const handleEdit = (item: BucketListItem) => {
    traceUserAction("edit_item_click", {
      "item.id": item.id,
      "item.category": item.category,
    })

    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      deadline: item.deadline || "",
      progress: item.progress,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const item = items.find((item) => item.id === id)

    traceUserAction("delete_item_click", {
      "item.id": id,
      "item.category": item?.category,
    })

    if (window.confirm("Are you sure you want to delete this goal?")) {
      deleteItem(id)
    }
  }

  const handleToggleComplete = (id: string) => {
    const item = items.find((item) => item.id === id)

    traceUserAction("toggle_complete_click", {
      "item.id": id,
      "item.category": item?.category,
      "item.current_status": item?.completed ? "completed" : "incomplete",
    })

    toggleComplete(id)
  }

  const handleCategoryFilter = (category: string) => {
    traceUserAction("category_filter", {
      "filter.category": category,
      "filter.previous": selectedCategory,
    })

    setSelectedCategory(category)
  }

  const handleDialogOpen = (open: boolean) => {
    traceUserAction(open ? "dialog_open" : "dialog_close", {
      "dialog.type": "goal_form",
      "dialog.mode": editingItem ? "edit" : "create",
    })

    if (open && !editingItem) {
      resetForm()
    }
    setIsDialogOpen(open)
  }

  const filteredItems = selectedCategory === "all" ? items : items.filter((item) => item.category === selectedCategory)
  const overallProgress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  const getCategoryColor = (category: string) => {
    return categories.find((cat) => cat.value === category)?.color || "bg-gray-100 text-gray-800"
  }

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bucket list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-2 h-auto p-0 text-red-600 hover:text-red-800"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Bucket List</h1>
          <p className="text-gray-600 mb-6">Track your dreams and make them reality</p>

          {/* Overall Progress */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-medium text-gray-800">
                {stats.completed}/{stats.total}
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            {stats.overdue > 0 && (
              <p className="text-sm text-red-600 mt-2">
                {stats.overdue} overdue goal{stats.overdue !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => handleCategoryFilter("all")}
            className="rounded-full"
          >
            All ({items.length})
          </Button>
          {categories.map((category) => {
            const count = items.filter((item) => item.category === category.value).length
            return (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                onClick={() => handleCategoryFilter(category.value)}
                className="rounded-full"
              >
                {category.label} ({count})
              </Button>
            )
          })}
        </div>

        {/* Add New Item Button */}
        <div className="text-center mb-8">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white rounded-full px-6 py-3">
                <Plus className="w-4 h-4 mr-2" />
                Add New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Goal" : "Add New Goal"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What do you want to achieve?"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your goal in detail..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="progress">Progress: {formData.progress}%</Label>
                  <Input
                    id="progress"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Number.parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingItem ? "Update Goal" : "Add Goal"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bucket List Items */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`transition-all duration-200 hover:shadow-lg ${
                item.completed ? "bg-green-50 border-green-200" : "bg-white"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${item.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                      {item.title}
                    </CardTitle>
                    <Badge className={`mt-2 ${getCategoryColor(item.category)}`}>
                      {categories.find((cat) => cat.value === item.category)?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 w-8 p-0">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {item.description && <p className="text-gray-600 text-sm mb-4">{item.description}</p>}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>

                {/* Deadline */}
                {item.deadline && (
                  <div
                    className={`flex items-center gap-2 text-sm mb-4 ${
                      isOverdue(item.deadline) && !item.completed ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Due: {new Date(item.deadline).toLocaleDateString()}</span>
                    {isOverdue(item.deadline) && !item.completed && (
                      <span className="text-red-600 font-medium">(Overdue)</span>
                    )}
                  </div>
                )}

                {/* Complete Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`complete-${item.id}`}
                    checked={item.completed}
                    onCheckedChange={() => handleToggleComplete(item.id)}
                  />
                  <Label
                    htmlFor={`complete-${item.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.completed ? "Completed!" : "Mark as complete"}
                  </Label>
                  {item.completed && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              {selectedCategory === "all"
                ? "No goals yet"
                : `No ${categories.find((cat) => cat.value === selectedCategory)?.label.toLowerCase()} goals yet`}
            </h3>
            <p className="text-gray-500">
              {selectedCategory === "all"
                ? "Start by adding your first bucket list goal!"
                : "Try selecting a different category or add a new goal."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
