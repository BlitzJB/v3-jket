'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PickerDialog } from './picker-dialog'
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

interface QATestFormProps {
  categories: Category[]
}

export function QATestForm({ categories }: QATestFormProps) {
  const router = useRouter()
  const [testConfig, setTestConfig] = useState<{ groups: TestGroup[] }>(defaultTestConfig as unknown as { groups: TestGroup[] })
  const [activeTab, setActiveTab] = useState("")
  const [testResults, setTestResults] = useState<TestResults>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [manufactureDate, setManufactureDate] = useState<Date>()
  const [serialNumber, setSerialNumber] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update test configuration when category changes
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory)
      if (category) {
        const rawConfig = category.testConfiguration || defaultTestConfig
        const config = rawConfig as unknown as { groups: TestGroup[] }
        setTestConfig(config)
        setActiveTab(config.groups[0]?.name || "")
        
        // Initialize test results with default values for the new configuration
        const initialResults: TestResults = {}
        config.groups.forEach(group => {
          group.tests.forEach(test => {
            initialResults[test.name] = {
              range: '',
              condition: '',
              passed: true,
            }
          })
        })
        setTestResults(initialResults)
      }
    }
  }, [selectedCategory, categories])

  // Reset model when category changes
  useEffect(() => {
    setSelectedModel('')
  }, [selectedCategory])

  // Generate serial number when all required fields are selected
  useEffect(() => {
    const generateSerialNumber = async () => {
      if (selectedCategory && selectedModel && manufactureDate) {
        const category = categories.find(c => c.id === selectedCategory)
        const model = category?.machineModels.find(m => m.id === selectedModel)
        
        if (category && model) {
          try {
            const response = await fetch(`/api/quality-testing/machines?modelId=${model.id}`)
            if (!response.ok) throw new Error('Failed to get machine count')
            const { count } = await response.json()
            
            const dateStr = format(manufactureDate, 'yyyy')
            const newSerialNumber = `${category.shortCode}-${model.shortCode}-${dateStr}-${String(count + 1).padStart(4, '0')}`
            setSerialNumber(newSerialNumber)
          } catch (error) {
            console.error('Error getting machine count:', error)
            toast.error('Failed to generate serial number')
          }
        }
      }
    }

    generateSerialNumber()
  }, [selectedCategory, selectedModel, manufactureDate, categories])

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
    if (!selectedModel || !manufactureDate || !serialNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/quality-testing/machines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber,
          machineModelId: selectedModel,
          manufacturingDate: manufactureDate,
          testResults,
          additionalNotes: notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create machine')
      }

      toast.success('Machine test results logged successfully')
      router.push('/dashboard/quality-testing/history')
      router.refresh()
    } catch (error) {
      console.error('Error creating machine:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create machine')
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
              <PickerDialog
                type="category"
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <PickerDialog
                type="model"
                categories={categories}
                selectedCategory={selectedCategory}
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
                disabled={!selectedCategory}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manufacturing Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !manufactureDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {manufactureDate ? format(manufactureDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={manufactureDate}
                    onSelect={setManufactureDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input value={serialNumber} disabled />
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

      {selectedCategory && testConfig.groups.length > 0 && (
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
          onClick={() => router.push('/dashboard/quality-testing')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Test Results'}
        </Button>
      </div>
    </form>
  )
} 

