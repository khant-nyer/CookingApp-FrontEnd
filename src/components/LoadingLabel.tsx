interface LoadingLabelProps {
  label?: string;
}

const chefHatAnimationUrl = 'https://cdn-icons-gif.flaticon.com/16678/16678071.gif';

export default function LoadingLabel({ label = 'Loading…' }: LoadingLabelProps) {
  return (
    <span className="loading-label" role="status" aria-live="polite">
      <img
        src={chefHatAnimationUrl}
        alt="Cooking animation"
        className="loading-label__icon"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
      <span>{label}</span>
    </span>
  );
}
