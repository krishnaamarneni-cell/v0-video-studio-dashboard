import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export function LogoUpload() {
  return (
    <Card className="p-6 border-dashed">
      <div className="text-center space-y-4">
        <Upload size={32} className="mx-auto text-muted-foreground" />
        <div>
          <p className="font-medium text-card-foreground">Upload Logo</p>
          <p className="text-sm text-muted-foreground">
            Drag and drop your logo or click to browse
          </p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Choose File
        </Button>
      </div>
    </Card>
  )
}
