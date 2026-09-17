'use client'

import { useState } from 'react'
import { Combobox } from '@/components/ui/Combobox'

/** The combobox in the styleguide needs local state; the page itself stays a server component. */
export function StyleguideCombobox({ label }: { label: string }) {
  const [value, setValue] = useState('')
  return (
    <Combobox
      id="sg-combobox"
      name="sg-combobox"
      label={label}
      value={value}
      onChange={setValue}
      placeholder="—"
      noResultsLabel="—"
      options={[
        { value: 'a', label: 'فلسطين بوصلتنا' },
        { value: 'b', label: 'قادة الغد' },
        { value: 'c', label: 'صنّاع الأثر' },
      ]}
    />
  )
}
