import { useState } from 'react'

export function useToolStore() {
    const [tool, setTool] = useState('select')
    return { tool, setTool }
}
