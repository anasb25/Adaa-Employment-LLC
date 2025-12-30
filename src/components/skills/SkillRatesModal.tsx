import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { skillRatesApi } from "../../services/api/skillRatesApi";
import { rateVariantsApi } from "../../services/api/rateVariantsApi";
import { RateType, SkillRate } from "../../types/rate-variant";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import { TrashBinIcon } from "../../icons";
import { QUERY_KEYS } from "../../lib/constants";

interface SkillRatesModalProps {
  skillId: number;
  skillName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillRatesModal({
  skillId,
  skillName,
  isOpen,
  onClose,
}: SkillRatesModalProps) {
  const queryClient = useQueryClient();
  const [rates, setRates] = useState<
    Array<{
      rateVariantId: number;
      rateType: RateType;
      employeeRateValue: string;
      clientRateValue: string;
      notes: string;
    }>
  >([]);

  // Fetch rate variants
  const { data: rateVariants = [] } = useQuery({
    queryKey: ["rateVariants"],
    queryFn: () => rateVariantsApi.getRateVariants(),
    enabled: isOpen,
  });

  // Fetch existing rates
  const { data: existingRates = [], refetch } = useQuery({
    queryKey: ["skillRates", skillId],
    queryFn: () => skillRatesApi.getSkillRates(skillId),
    enabled: isOpen,
  });

  // Initialize form
  useEffect(() => {
    if (existingRates.length > 0) {
      setRates(
        existingRates.map((rate: SkillRate) => ({
          rateVariantId: rate.rateVariantId,
          rateType: rate.rateType,
          employeeRateValue: rate.employeeRateValue.toString(),
          clientRateValue: rate.clientRateValue.toString(),
          notes: rate.notes || "",
        }))
      );
    } else if (rateVariants.length > 0) {
      const baseRate = rateVariants.find((rv: any) => rv.isBaseRate);
      if (baseRate) {
        setRates([
          {
            rateVariantId: baseRate.id,
            rateType: RateType.FLAT,
            employeeRateValue: "",
            clientRateValue: "",
            notes: "",
          },
        ]);
      }
    }
  }, [existingRates, rateVariants]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const validRates = rates.filter(
        (r) => r.employeeRateValue && r.clientRateValue && parseFloat(r.employeeRateValue) > 0 && parseFloat(r.clientRateValue) > 0
      );
      return skillRatesApi.bulkCreateSkillRates(skillId, {
        rates: validRates.map((r) => ({
          rateVariantId: r.rateVariantId,
          rateType: r.rateType,
          employeeRateValue: parseFloat(r.employeeRateValue),
          clientRateValue: parseFloat(r.clientRateValue),
          notes: r.notes || undefined,
        })),
      });
    },
    onSuccess: () => {
      toast.success("Skill rates configured successfully!");
      // Invalidate skill rates queries
      queryClient.invalidateQueries({ queryKey: ["skillRates", skillId] });
      // Invalidate skills list to update rate status indicators
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills.search });
      refetch();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save rates");
    },
  });

  const handleAddRate = () => {
    const unusedVariants = rateVariants.filter(
      (rv: any) => !rates.some((r) => r.rateVariantId === rv.id)
    );
    if (unusedVariants.length > 0) {
      setRates([
        ...rates,
        {
          rateVariantId: unusedVariants[0].id,
          rateType: RateType.FLAT,
          employeeRateValue: "",
          clientRateValue: "",
          notes: "",
        },
      ]);
    } else {
      toast.error("All rate variants have been added");
    }
  };

  const handleRemoveRate = (index: number) => {
    setRates(rates.filter((_, i) => i !== index));
  };

  const handleRateChange = (index: number, field: string, value: any) => {
    const newRates = [...rates];
    (newRates[index] as any)[field] = value;
    setRates(newRates);
  };

  const baseRate = rates.find((r) => {
    const variant = rateVariants.find((rv: any) => rv.id === r.rateVariantId);
    return variant?.isBaseRate;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Rate Variants - ${skillName}`}
      size="lg"
    >
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define employee pay rates and client billing rates for different scenarios.
          The base rate must be flat. Other rates can be flat or multipliers.
        </p>

        <div className="space-y-4">
          {rates.map((rate, index) => {
            const variant = rateVariants.find((rv: any) => rv.id === rate.rateVariantId);
            const isBase = variant?.isBaseRate;
            const availableVariants = rateVariants.filter(
              (rv: any) =>
                rv.id === rate.rateVariantId ||
                !rates.some((r) => r.rateVariantId === rv.id)
            );

            return (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label>Rate Variant</Label>
                  {!isBase && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRate(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Select
                  options={availableVariants.map((rv: any) => ({
                    value: rv.id.toString(),
                    label: rv.name,
                  }))}
                  value={rate.rateVariantId.toString()}
                  onChange={(value) =>
                    handleRateChange(index, "rateVariantId", parseInt(value))
                  }
                  disabled={isBase}
                />

                <div>
                  <Label>Rate Type</Label>
                  <Select
                    options={[
                      { value: RateType.FLAT, label: "Flat Amount (AED)" },
                      { value: RateType.MULTIPLIER, label: "Multiplier of Base" },
                    ].filter((opt) => !isBase || opt.value === RateType.FLAT)}
                    value={rate.rateType}
                    onChange={(value) => handleRateChange(index, "rateType", value)}
                    disabled={isBase}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>
                      {rate.rateType === RateType.FLAT
                        ? "Employee Rate (AED/hr)"
                        : "Employee Multiplier"}
                    </Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={rate.employeeRateValue}
                      onChange={(e) =>
                        handleRateChange(index, "employeeRateValue", e.target.value)
                      }
                      placeholder={rate.rateType === RateType.FLAT ? "8.00" : "1.2"}
                    />
                    {rate.rateType === RateType.MULTIPLIER && baseRate && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Final: AED{" "}
                        {(
                          parseFloat(baseRate.employeeRateValue || "0") *
                          parseFloat(rate.employeeRateValue || "0")
                        ).toFixed(2)}
                        /hr
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      {rate.rateType === RateType.FLAT
                        ? "Client Rate (AED/hr)"
                        : "Client Multiplier"}
                    </Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={rate.clientRateValue}
                      onChange={(e) =>
                        handleRateChange(index, "clientRateValue", e.target.value)
                      }
                      placeholder={rate.rateType === RateType.FLAT ? "10.00" : "1.2"}
                    />
                    {rate.rateType === RateType.MULTIPLIER && baseRate && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Final: AED{" "}
                        {(
                          parseFloat(baseRate.clientRateValue || "0") *
                          parseFloat(rate.clientRateValue || "0")
                        ).toFixed(2)}
                        /hr
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Input
                    type="text"
                    value={rate.notes}
                    onChange={(e) => handleRateChange(index, "notes", e.target.value)}
                    placeholder="e.g., >10 hours, 10pm-6am"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleAddRate}
          className="w-full"
          disabled={rates.length >= rateVariants.length}
        >
          + Add Another Rate Variant
        </Button>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Rates"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

