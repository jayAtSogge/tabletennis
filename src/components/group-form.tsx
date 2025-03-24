"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createRandomGroups } from "@/lib/actions"

const formSchema = z.object({
  numGroups: z.coerce
    .number()
    .int()
    .min(1, {
      message: "Number of groups must be at least 1.",
    })
    .max(10, {
      message: "Number of groups must be at most 10.",
    }),
})

export function GroupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numGroups: 2,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await createRandomGroups(values.numGroups)
      toast({
        title: "Success",
        description: `${values.numGroups} groups created successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create groups",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="numGroups"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Groups</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Random Groups"}
        </Button>
      </form>
    </Form>
  )
}
