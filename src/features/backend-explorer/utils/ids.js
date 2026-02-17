export function getItemId(item) {
  return item?.id || item?._id;
}

export function getRecipeTileId(recipe, index) {
  return getItemId(recipe) || `${recipe?.foodId || 'food'}-${recipe?.version || 'version'}-${index}`;
}
