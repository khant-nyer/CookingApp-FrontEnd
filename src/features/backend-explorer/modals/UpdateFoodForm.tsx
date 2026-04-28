import type { FoodUpdateForm, InputChangeEvent, UpdateModalState, Updater } from '../types';

interface UpdateFoodFormProps {
  form: FoodUpdateForm;
  setUpdateModal: (value: Updater<UpdateModalState>) => void;
}

export default function UpdateFoodForm({ form, setUpdateModal }: UpdateFoodFormProps) {
  return (
    <div className="form">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as FoodUpdateForm), name: event.target.value }
        }))}
      />
      <input
        placeholder="Category"
        value={form.category}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as FoodUpdateForm), category: event.target.value }
        }))}
      />
      <input
        placeholder="Image URL"
        value={form.imageUrl}
        onChange={(event: InputChangeEvent) => setUpdateModal((prev) => ({
          ...prev,
          form: { ...(prev.form as FoodUpdateForm), imageUrl: event.target.value }
        }))}
      />
    </div>
  );
}
