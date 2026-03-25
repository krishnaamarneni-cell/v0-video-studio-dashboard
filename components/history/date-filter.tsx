import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { subDays, startOfDay, endOfDay } from 'date-fns'

interface DateFilterProps {
  onFilterChange: (range: { from?: string; to?: string }) => void
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const handleFilterChange = (period: string) => {
    const now = new Date()
    const today = startOfDay(now)
    
    switch (period) {
      case '7d':
        onFilterChange({
          from: subDays(today, 7).toISOString(),
          to: endOfDay(now).toISOString(),
        })
        break
      case '30d':
        onFilterChange({
          from: subDays(today, 30).toISOString(),
          to: endOfDay(now).toISOString(),
        })
        break
      case 'all':
        onFilterChange({})
        break
    }
  }

  return (
    <Tabs defaultValue="7d" onValueChange={handleFilterChange}>
      <TabsList className="bg-card border border-border">
        <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
        <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
        <TabsTrigger value="all">All Time</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
