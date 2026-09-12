import { Button } from "@/components/ui/button";

export function PinForm({
  pinned,
  action,
}: {
  pinned: boolean;
  action: () => Promise<void>;
}) {
  return (
    <form action={action}>
      <Button type="submit" size="xs" variant={pinned ? "secondary" : "outline"}>
        {pinned ? "Unpin" : "Pin"}
      </Button>
    </form>
  );
}
