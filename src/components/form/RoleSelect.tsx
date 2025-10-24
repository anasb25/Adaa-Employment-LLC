import React from "react";
import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "../../services/api/rolesApi";
import Select from "../form/Select";
import { QUERY_KEYS } from "../../lib/constants";

interface RoleSelectProps {
  value?: number;
  onChange: (roleId: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const RoleSelect: React.FC<RoleSelectProps> = ({
  value,
  onChange,
  placeholder = "Select a role",
  disabled = false,
  error,
}) => {
  const {
    data: roles = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: QUERY_KEYS.roles.all,
    queryFn: () => rolesApi.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const handleChange = (selectedValue: string) => {
    if (selectedValue === "") {
      onChange(0); // Reset to 0 for empty selection
    } else {
      const roleId = parseInt(selectedValue);
      if (!isNaN(roleId)) {
        onChange(roleId);
      }
    }
  };

  if (loading) {
    return (
      <Select
        options={[{ value: "", label: "Loading roles..." }]}
        value=""
        onChange={() => {}}
        placeholder="Loading roles..."
        className={disabled ? "opacity-50 cursor-not-allowed" : ""}
      />
    );
  }

  if (queryError) {
    return <div className="text-red-500 text-sm">Failed to load roles</div>;
  }

  const options = [
    ...roles.map((role) => ({
      value: role.id.toString(),
      label: `${role.name.charAt(0).toUpperCase() + role.name.slice(1)} - ${
        role.description
      }`,
    })),
  ];

  return (
    <div>
      <Select
        options={options}
        value={value && value > 0 ? value.toString() : ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={disabled ? "opacity-50 cursor-not-allowed" : ""}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default RoleSelect;
