
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Pin, Link } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

export function ContactUs() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  function onSubmit(values: FormData) {
    const subject = encodeURIComponent(`New message from ${values.name}`);
    const body = encodeURIComponent(values.message);
    window.location.href = `mailto:team@thechildlens.com?subject=${subject}&body=${body}`;
  }

  return (
    <section id="contact" className="bg-background text-foreground py-20 md:py-32">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl md:text-7xl font-headline font-bold text-center text-black mb-16">
          Contact Us.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us how we can help"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg">Send Message</Button>
              </form>
            </Form>
          </div>
          <div className="flex flex-col gap-8">
            <div className="space-y-4 text-base">
                <div className="flex items-start">
                    <Mail className="w-5 h-5 mr-3 mt-1 shrink-0"/>
                    <a href="mailto:team@thechildlens.com" className="hover:underline">team@thechildlens.com</a>
                </div>
                 <div className="flex items-start">
                    <Pin className="w-5 h-5 mr-3 mt-1 shrink-0"/>
                    <p>Tech Barcelona - Pier07<br/>Via Laietana, 26, Ciutat Vella, 08003 Barcelona</p>
                </div>
                <div className="flex items-start">
                    <Link className="w-5 h-5 mr-3 mt-1 shrink-0"/>
                    <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">Firebase Console</a>
                </div>
            </div>
            <div className="h-[300px] md:h-[400px] w-full rounded-lg overflow-hidden shadow-lg">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2993.686267158732!2d2.176059915425712!3d41.3809623792648!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4a2f8b5a7b6f5%3A0xac8d6897c5a8e01!2sTech%20Barcelona%20-%20Pier07!5e0!3m2!1sen!2ses!4v1682522745778!5m2!1sen!2ses"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Tech Pier 07 Location"
                ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
