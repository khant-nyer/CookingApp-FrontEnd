import type { BackendExplorerCreateFlow, InputChangeEvent } from '../types';

interface CreateFoodFormProps {
  foodFlow: BackendExplorerCreateFlow['food'];
}

export default function CreateFoodForm({ foodFlow }: CreateFoodFormProps) {
  const { form, setForm } = foodFlow;

  return (
    <form className="form" onSubmit={(event) => event.preventDefault()}>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, name: event.target.value }))}
      />
      <input
        placeholder="Category"
        value={form.category}
        onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, category: event.target.value }))}
      />
      <input
        placeholder="Image URL"
        value={form.imageUrl}
        onChange={(event: InputChangeEvent) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
      />
    </form>
  );
}
