'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from "@/components/ui/switch"
import { defaultTestConfig } from '@/app/dashboard/admin/equipment/test-config/test-config-manager'

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

interface Category {
  id: string
  name: string
  shortCode: string
  machineModels: MachineModel[]
  testConfiguration: { groups: TestGroup[] } | null
}

interface MachineModel {
  id: string
  name: string
  shortCode: string
  categoryId: string
}

interface TestResult {
  range?: string
  condition: string
  passed: boolean
}

interface TestResults {
  [key: string]: TestResult
}

interface Machine {
  id: string
  serialNumber: string
  machineModelId: string
  manufacturingDate: Date
  testResultData: any
  testAdditionalNotes: string | null
  machineModel: {
    id: string
    name: string
    shortCode: string
    categoryId: string
    category: {
      id: string
      name: string
      shortCode: string
      testConfiguration: { groups: TestGroup[] } | null
    }
  }
}

interface EditTestFormProps {
  categories: Category[]
  machine: Machine
}

export function EditTestForm({ categories, machine }: EditTestFormProps) {
  const router = useRouter()
  const [testConfig, setTestConfig] = useState<{ groups: TestGroup[] }>(defaultTestConfig as unknown as { groups: TestGroup[] })
  const [activeTab, setActiveTab] = useState("")
  const [testResults, setTestResults] = useState<TestResults>({})
  const [notes, setNotes] = useState(machine.testAdditionalNotes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update test configuration when component mounts
  useEffect(() => {
    const category = machine.machineModel.category
    const rawConfig = category.testConfiguration || defaultTestConfig
    const config = rawConfig as unknown as { groups: TestGroup[] }
    setTestConfig(config)
    setActiveTab(config.groups[0]?.name || "")
    
    // Initialize test results with values from the machine
    const initialResults: TestResults = {}
    const machineResults = machine.testResultData as Record<string, TestResult>
    
    // Ensure all tests from the config are included with defaults
    config.groups.forEach(group => {
      group.tests.forEach(test => {
        if (machineResults[test.name]) {
          initialResults[test.name] = machineResults[test.name]
        } else {
          initialResults[test.name] = {
            range: '',
            condition: '',
            passed: true,
          }
        }
      })
    })
    
    setTestResults(initialResults)
  }, [machine])

  const handleInputChange = (testName: string, field: keyof Omit<TestResult, 'passed'>, value: string) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: {
        ...prev[testName],
        [field]: value,
        passed: prev[testName]?.passed ?? true,
      }
    }))
  }

  const handlePassFailChange = (testName: string, passed: boolean) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: {
        range: prev[testName]?.range || '',
        condition: prev[testName]?.condition || '',
        passed,
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quality-testing/machines/${machine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testResults,
          additionalNotes: notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update machine')
      }

      toast.success('Machine test results updated successfully')
      router.push('/dashboard/quality-testing/history')
      router.refresh()
    } catch (error) {
      console.error('Error updating machine:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update machine')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input 
                value={machine.machineModel.category.name} 
                disabled 
                className="bg-muted" 
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input 
                value={machine.machineModel.name} 
                disabled 
                className="bg-muted" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manufacturing Date</Label>
              <Input
                value={format(new Date(machine.manufacturingDate), "PPP")}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input 
                value={machine.serialNumber} 
                disabled 
                className="bg-muted" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes or observations"
            />
          </div>
        </div>
      </Card>

      {testConfig.groups.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${testConfig.groups.length}, 1fr)` }}>
            {testConfig.groups.map(group => (
              <TabsTrigger
                key={group.name}
                value={group.name}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {testConfig.groups.map(group => (
            <TabsContent key={group.name} value={group.name} className="space-y-4">
              <Card>
                <div className="p-6 space-y-4">
                  {group.tests.map(test => (
                    <div key={test.name} className="space-y-4 pb-4 border-b last:border-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{test.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {testResults[test.name]?.passed !== false ? "Pass" : "Fail"}
                          </span>
                          <Switch
                            checked={testResults[test.name]?.passed !== false}
                            onCheckedChange={(checked) => handlePassFailChange(test.name, checked)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {test.type === 'both' && (
                          <div className="space-y-2">
                            <Label>Range</Label>
                            <Input
                              value={testResults[test.name]?.range || ''}
                              onChange={(e) => handleInputChange(test.name, 'range', e.target.value)}
                              placeholder="Enter range"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Input
                            value={testResults[test.name]?.condition || ''}
                            onChange={(e) => handleInputChange(test.name, 'condition', e.target.value)}
                            placeholder="Enter condition"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/dashboard/quality-testing/history')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Test Results'}
        </Button>
      </div>
    </form>
  )
} 