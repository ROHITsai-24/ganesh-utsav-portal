import { Button } from '@/components/ui/button'

const CTAButton = ({ children, className = '', ...props }) => (
  <Button
    className={`bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-full ${className}`}
    {...props}
  >
    {children}
  </Button>
)

export default CTAButton
