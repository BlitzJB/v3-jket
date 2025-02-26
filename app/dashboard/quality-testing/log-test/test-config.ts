export interface Test {
  name: string
  type: 'both' | 'condition'
}

export interface TestCategory {
  name: string
  tests: Test[]
}

export const testCategories: TestCategory[] = [
  {
    name: "Mechanical Testing",
    tests: [
      { name: "Flow Rate", type: "both" },
      { name: "Suction Power", type: "both" },
      { name: "Temperature", type: "both" },
      { name: "Pressure", type: "both" },
      { name: "Hours of Running Test", type: "both" },
      { name: "Motor Bearing Condition", type: "both" },
      { name: "Shaft Movement", type: "both" },
      { name: "Leakages from Valves/Couplings", type: "both" },
      { name: "Hose Clamping Quality", type: "both" },
      { name: "Parts are Fit Where It Should", type: "both" },
      { name: "Bolting Quality", type: "both" },
      { name: "3 Way Valves Condition", type: "both" },
      { name: "Flow Direction", type: "both" }
    ]
  },
  {
    name: "Electrical Testing",
    tests: [
      { name: "Terminal Box Quality", type: "both" },
      { name: "Terminal Supply Pin", type: "both" },
      { name: "Wiring Condition", type: "both" },
      { name: "Motor Name Plate", type: "both" },
      { name: "Voltage Rating", type: "both" },
      { name: "Ampere Rating", type: "both" },
      { name: "Motor Power", type: "both" },
      { name: "Motor Sound", type: "both" },
      { name: "Winding Condition", type: "both" },
      { name: "Insulation Resistance Test", type: "both" },
      { name: "Stator Poles", type: "both" },
      { name: "Motor Efficiency", type: "both" },
      { name: "Polarity Test", type: "both" },
      { name: "Earth Continuity Test", type: "both" },
      { name: "Shaft Speed(rpm)", type: "both" }
    ]
  },
  {
    name: "Electronics Testing",
    tests: [
      { name: "Display Quality", type: "condition" },
      { name: "Sensor Reading", type: "condition" },
      { name: "Display Inches", type: "condition" },
      { name: "Operating Temperature", type: "condition" },
      { name: "Frequency as per Specification", type: "condition" },
      { name: "Power Source", type: "condition" },
      { name: "IF DC Battery Capacity", type: "condition" },
      { name: "Screen Touch Quality", type: "condition" }
    ]
  },
  {
    name: "Physical Observation",
    tests: [
      { name: "Visual Aesthetics", type: "condition" },
      { name: "No Dent or Damage", type: "condition" },
      { name: "SL No Sticker Placing", type: "condition" },
      { name: "Power Flush Sticker Placing", type: "condition" },
      { name: "Product Painting", type: "condition" },
      { name: "All Accessories Packed", type: "condition" },
      { name: "Openings Correctly Covered", type: "condition" },
      { name: "All Bolt Tightness", type: "condition" },
      { name: "Final Packing Quality", type: "condition" },
      { name: "Weight Checking", type: "condition" },
      { name: "Quantity Checking", type: "condition" },
      { name: "Check the Handling Process of Loading", type: "condition" }
    ]
  }
] 