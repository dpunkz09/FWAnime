"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchField, Button } from "@heroui/react";

interface Props {
  defaultValue?: string;
}

export default function SearchForm({ defaultValue = "" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  function submit(val: string) {
    const trimmed = val.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <div className="flex gap-3 items-start flex-wrap">
      {/* HeroUI SearchField */}
      <SearchField
        fullWidth
        aria-label="Search anime"
        value={value}
        onChange={setValue}
        onSubmit={submit}
        className="flex-1 min-w-[220px]"
        style={
          {
            // Override the group border/background to match the dark theme
            "--search-field-bg": "var(--color-surface)",
            "--search-field-border": "var(--color-border)",
          } as React.CSSProperties
        }
      >
        <SearchField.Group
          className="rounded-lg h-11"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "none",
          }}
        >
          <SearchField.SearchIcon
            className="ml-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <SearchField.Input
            placeholder="Search anime, characters..."
            className="text-sm"
            style={{ color: "var(--color-heading)" }}
          />
          <SearchField.ClearButton className="mr-1" />
        </SearchField.Group>
      </SearchField>

      {/* Search button */}
      <Button
        size="md"
        className="h-11 font-semibold px-6 shrink-0"
        style={{ backgroundColor: "var(--color-blue)", color: "white" }}
        onPress={() => submit(value)}
      >
        Search
      </Button>
    </div>
  );
}
