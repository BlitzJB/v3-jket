"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Plus, X, ChevronRight, Search, Pencil } from "lucide-react"

// Default test configuration that will be used when a category doesn't have its own
export const defaultTestConfig = {
  groups: [
    {
      id: "mechanical",
      name: "Mechanical Testing",
      tests: [
        { id: "flow-rate", name: "Flow Rate", type: "both" },
        { id: "suction-power", name: "Suction Power", type: "both" },
        { id: "temperature", name: "Temperature", type: "both" },
        { id: "pressure", name: "Pressure", type: "both" },
        { id: "running-test", name: "Hours of Running Test", type: "both" },
        { id: "motor-bearing", name: "Motor Bearing Condition", type: "both" },
        { id: "shaft-movement", name: "Shaft Movement", type: "both" },
        { id: "leakages", name: "Leakages from Valves/Couplings", type: "both" },
        { id: "hose-clamping", name: "Hose Clamping Quality", type: "both" },
        { id: "parts-fit", name: "Parts are Fit Where It Should", type: "both" },
        { id: "bolting", name: "Bolting Quality", type: "both" },
        { id: "valves", name: "3 Way Valves Condition", type: "both" },
        { id: "flow-direction", name: "Flow Direction", type: "both" }
      ]
    },
    {
      id: "electrical",
      name: "Electrical Testing",
      tests: [
        { id: "terminal-box", name: "Terminal Box Quality", type: "both" },
        { id: "terminal-supply", name: "Terminal Supply Pin", type: "both" },
        { id: "wiring", name: "Wiring Condition", type: "both" },
        { id: "motor-nameplate", name: "Motor Name Plate", type: "both" },
        { id: "voltage", name: "Voltage Rating", type: "both" },
        { id: "ampere", name: "Ampere Rating", type: "both" },
        { id: "motor-power", name: "Motor Power", type: "both" },
        { id: "motor-sound", name: "Motor Sound", type: "both" },
        { id: "winding", name: "Winding Condition", type: "both" },
        { id: "insulation", name: "Insulation Resistance Test", type: "both" },
        { id: "stator", name: "Stator Poles", type: "both" },
        { id: "efficiency", name: "Motor Efficiency", type: "both" },
        { id: "polarity", name: "Polarity Test", type: "both" },
        { id: "earth", name: "Earth Continuity Test", type: "both" },
        { id: "shaft-speed", name: "Shaft Speed(rpm)", type: "both" }
      ]
    },
    {
      id: "electronics",
      name: "Electronics Testing",
      tests: [
        { id: "display", name: "Display Quality", type: "condition" },
        { id: "sensor", name: "Sensor Reading", type: "condition" },
        { id: "display-inches", name: "Display Inches", type: "condition" },
        { id: "operating-temp", name: "Operating Temperature", type: "condition" },
        { id: "frequency", name: "Frequency as per Specification", type: "condition" },
        { id: "power-source", name: "Power Source", type: "condition" },
        { id: "battery", name: "IF DC Battery Capacity", type: "condition" },
        { id: "touch", name: "Screen Touch Quality", type: "condition" }
      ]
    },
    {
      id: "physical",
      name: "Physical Observation",
      tests: [
        { id: "aesthetics", name: "Visual Aesthetics", type: "condition" },
        { id: "damage", name: "No Dent or Damage", type: "condition" },
        { id: "sl-sticker", name: "SL No Sticker Placing", type: "condition" },
        { id: "power-sticker", name: "Power Flush Sticker Placing", type: "condition" },
        { id: "painting", name: "Product Painting", type: "condition" },
        { id: "accessories", name: "All Accessories Packed", type: "condition" },
        { id: "openings", name: "Openings Correctly Covered", type: "condition" },
        { id: "bolt-tightness", name: "All Bolt Tightness", type: "condition" },
        { id: "packing", name: "Final Packing Quality", type: "condition" },
        { id: "weight", name: "Weight Checking", type: "condition" },
        { id: "quantity", name: "Quantity Checking", type: "condition" },
        { id: "loading", name: "Check the Handling Process of Loading", type: "condition" }
      ]
    }
  ]
}

interface Category {
  id: string
  name: string
  testConfiguration: any | null
}

interface Test {
  id: string
  name: string
  type: "both" | "condition"
}

interface TestGroup {
  id: string
  name: string
  tests: Test[]
}

interface TestConfigManagerProps {
  initialCategories: Category[]
}

export function TestConfigManager({ initialCategories }: TestConfigManagerProps) {
  const [categories] = useState(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [testConfig, setTestConfig] = useState<{ groups: TestGroup[] } | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<TestGroup | null>(null)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showAddTest, setShowAddTest] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showEditTest, setShowEditTest] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [editingGroup, setEditingGroup] = useState<TestGroup | null>(null)
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [newTest, setNewTest] = useState<{ name: string; type: "both" | "condition" }>({
    name: "",
    type: "both"
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load test configuration when category is selected
  useEffect(() => {
    if (selectedCategory) {
      setTestConfig(selectedCategory.testConfiguration || defaultTestConfig)
      setSelectedGroup(null)
    }
  }, [selectedCategory])

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async () => {
    if (!selectedCategory || !testConfig) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/equipment/categories/${selectedCategory.id}/test-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testConfiguration: testConfig,
        }),
      })

      if (!response.ok) throw new Error("Failed to save test configuration")

      toast.success("Test configuration saved successfully")
    } catch (error) {
      console.error("Error saving test configuration:", error)
      toast.error("Failed to save test configuration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGroup = () => {
    if (!testConfig || !newGroupName.trim()) return

    const newGroup: TestGroup = {
      id: newGroupName.toLowerCase().replace(/\s+/g, "-"),
      name: newGroupName,
      tests: []
    }

    const updatedGroups = [...testConfig.groups, newGroup]

    setTestConfig({
      ...testConfig,
      groups: updatedGroups
    })
    setNewGroupName("")
    setShowAddGroup(false)
    setSelectedGroup(newGroup)
  }

  const handleAddTest = () => {
    if (!testConfig || !selectedGroup || !newTest.name.trim()) return

    const newTestItem: Test = {
      id: newTest.name.toLowerCase().replace(/\s+/g, "-"),
      name: newTest.name,
      type: newTest.type
    }

    const updatedGroups = testConfig.groups.map(group =>
      group.id === selectedGroup.id
        ? { ...group, tests: [...group.tests, newTestItem] }
        : group
    )

    setTestConfig({
      ...testConfig,
      groups: updatedGroups
    })

    // Update the selected group
    const updatedGroup = updatedGroups.find(g => g.id === selectedGroup.id)
    if (updatedGroup) {
      setSelectedGroup(updatedGroup)
    }

    setNewTest({ name: "", type: "both" })
    setShowAddTest(false)
  }

  const handleRemoveTest = (groupId: string, testId: string) => {
    if (!testConfig) return

    const updatedGroups = testConfig.groups.map(group =>
      group.id === groupId
        ? { ...group, tests: group.tests.filter(test => test.id !== testId) }
        : group
    )

    setTestConfig({
      ...testConfig,
      groups: updatedGroups
    })

    // Update the selected group
    const updatedGroup = updatedGroups.find(g => g.id === groupId)
    if (updatedGroup) {
      setSelectedGroup(updatedGroup)
    }
  }

  const handleRemoveGroup = (groupId: string) => {
    if (!testConfig) return

    setTestConfig({
      ...testConfig,
      groups: testConfig.groups.filter(group => group.id !== groupId)
    })
    setSelectedGroup(null)
  }

  const handleEditGroup = () => {
    if (!testConfig || !editingGroup || !newGroupName.trim()) return

    setTestConfig({
      ...testConfig,
      groups: testConfig.groups.map(group =>
        group.id === editingGroup.id
          ? { ...group, name: newGroupName }
          : group
      )
    })
    setNewGroupName("")
    setShowEditGroup(false)
    setEditingGroup(null)
  }

  const handleEditTest = () => {
    if (!testConfig || !selectedGroup || !editingTest || !newTest.name.trim()) return

    const updatedGroups = testConfig.groups.map(group =>
      group.id === selectedGroup.id
        ? {
            ...group,
            tests: group.tests.map(test =>
              test.id === editingTest.id
                ? { ...test, name: newTest.name, type: newTest.type }
                : test
            )
          }
        : group
    )

    setTestConfig({
      ...testConfig,
      groups: updatedGroups
    })

    // Update the selected group
    const updatedGroup = updatedGroups.find(g => g.id === selectedGroup.id)
    if (updatedGroup) {
      setSelectedGroup(updatedGroup)
    }

    setNewTest({ name: "", type: "both" })
    setShowEditTest(false)
    setEditingTest(null)
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left Pane - Categories */}
      <div className="w-64 bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100%-5rem)]">
          <div className="p-2">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
                  selectedCategory?.id === category.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="flex-1 text-left">{category.name}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Pane - Test Configuration */}
      <div className="flex-1 bg-card rounded-lg border shadow-sm">
        {selectedCategory ? (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">{selectedCategory.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure test groups and tests
                  </p>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                  Save Changes
                </Button>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium">Test Groups</h4>
                <p className="text-sm text-muted-foreground">
                  Select a group to manage its tests
                </p>
              </div>
            </div>

            <div className="flex-1 flex gap-6 p-6">
              {/* Test Groups List */}
              <div className="w-64 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {testConfig?.groups.map((group) => (
                      <div
                        key={group.id}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors",
                          selectedGroup?.id === group.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-card hover:bg-muted"
                        )}
                      >
                        <button
                          className="flex-1 flex items-center text-left"
                          onClick={() => setSelectedGroup(group)}
                        >
                          <span className="flex-1">{group.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {group.tests.length}
                          </Badge>
                        </button>
                        {selectedGroup?.id === group.id && (
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => {
                                setNewGroupName(group.name)
                                setEditingGroup(group)
                                setShowEditGroup(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleRemoveGroup(group.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowAddGroup(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Group
                  </Button>
                </div>
              </div>

              {/* Tests List */}
              <div className="flex-1">
                {selectedGroup ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        Tests in {selectedGroup.name}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddTest(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test
                      </Button>
                    </div>

                    <ScrollArea className="h-[calc(100vh-26rem)]">
                      <div className="space-y-2">
                        {selectedGroup.tests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {test.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {test.type === "both"
                                  ? "Range & Condition"
                                  : "Condition Only"}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setNewTest({
                                    name: test.name,
                                    type: test.type,
                                  })
                                  setEditingTest(test)
                                  setShowEditTest(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleRemoveTest(selectedGroup.id, test.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a test group to manage its tests
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a category to configure its tests
          </div>
        )}
      </div>

      {/* Add Group Dialog */}
      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize related tests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Group Name
              </label>
              <Input
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGroup(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup}>
              Add Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditGroup} onOpenChange={setShowEditGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Test Group</DialogTitle>
            <DialogDescription>
              Update the group name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Group Name
              </label>
              <Input
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditGroup(false)
              setEditingGroup(null)
              setNewGroupName("")
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditGroup}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Test Dialog */}
      <Dialog open={showAddTest} onOpenChange={setShowAddTest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test</DialogTitle>
            <DialogDescription>
              Add a new test to the {selectedGroup?.name} group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Test Name
              </label>
              <Input
                placeholder="Enter test name"
                value={newTest.name}
                onChange={(e) =>
                  setNewTest({ ...newTest, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Test Type
              </label>
              <Select
                value={newTest.type}
                onValueChange={(value: "both" | "condition") =>
                  setNewTest({ ...newTest, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">
                    Range & Condition
                  </SelectItem>
                  <SelectItem value="condition">
                    Condition Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTest(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTest}>
              Add Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Test Dialog */}
      <Dialog open={showEditTest} onOpenChange={setShowEditTest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>
              Update the test configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Test Name
              </label>
              <Input
                placeholder="Enter test name"
                value={newTest.name}
                onChange={(e) =>
                  setNewTest({ ...newTest, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Test Type
              </label>
              <Select
                value={newTest.type}
                onValueChange={(value: "both" | "condition") =>
                  setNewTest({ ...newTest, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">
                    Range & Condition
                  </SelectItem>
                  <SelectItem value="condition">
                    Condition Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditTest(false)
              setEditingTest(null)
              setNewTest({ name: "", type: "both" })
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditTest}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 