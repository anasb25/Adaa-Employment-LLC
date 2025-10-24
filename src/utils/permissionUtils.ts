// Utility function to convert permission names to friendly display text
export const getPermissionDisplayName = (permissionName: string): string => {
  const [resource, action] = permissionName.split(":");

  return `${titleCase(action)}`;
};

// Helper function to convert string to title case
const titleCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
};
