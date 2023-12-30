"use client"

import { useState } from "react"

import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export type ComboBoxProps = {
  dialogRef?: React.RefObject<HTMLElement>
  options: { label: string; value: string; disabled?: boolean }[]
  defaultValue?: string
  onChange?: (value: string) => void
  disabled?: boolean
  inputValue?: string
  onInputChange?: (value: string) => void
  placeholders?: {
    button?: string
    input?: string
  }
  classes?: {
    button?: string
    popoverContent?: string
  }
}
export function ComboBox(props: ComboBoxProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(props.defaultValue ?? "")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", props.classes?.button)}
          disabled={props.disabled}
        >
          {value
            ? props.options.find((opt) => opt.value === value)?.label
            : props.placeholders?.button ?? ""}
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0", props.classes?.popoverContent)}
        side="bottom"
        align="start"
        // Needed to fix an issue where ScrollArea does not work inside of a Dialog
        // Fix: https://github.com/shadcn-ui/ui/issues/922
        // Related: https://github.com/radix-ui/primitives/issues/1159
        container={props.dialogRef?.current === null ? undefined : props.dialogRef?.current}
      >
        <Command>
          <CommandInput
            placeholder={props.placeholders?.input}
            value={props.inputValue}
            onValueChange={props.onInputChange}
          />
          <CommandEmpty>No option found.</CommandEmpty>
          <ScrollArea className={cn(props.options.length > 5 && "h-40")}>
            <CommandGroup>
              {props.options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  disabled={opt.disabled}
                  className={cn(opt.disabled && "opacity-50")}
                  onSelect={(selectedValue) => {
                    const newValue = selectedValue === value ? "" : selectedValue
                    setValue(newValue)
                    setOpen(false)
                    props.onChange?.(newValue)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
