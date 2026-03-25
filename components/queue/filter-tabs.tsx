import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusType } from '@/lib/types'

interface FilterTabsProps {
  onFilterChange: (filter: StatusType | 'all') => void
}

export function FilterTabs({ onFilterChange }: FilterTabsProps) {
  return (
    <Tabs defaultValue="all" onValueChange={(v) => onFilterChange(v as StatusType | 'all')}>
      <TabsList className="bg-card border border-border">
        <TabsTrigger value="all">All Videos</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="ready">Ready to Post</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
