import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DateFilterProps {
  onFilterChange: (filter: string) => void
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  return (
    <Tabs defaultValue="7d" onValueChange={onFilterChange}>
      <TabsList className="bg-card border border-border">
        <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
        <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
        <TabsTrigger value="all">All Time</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
