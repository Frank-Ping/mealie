import { useTranslation } from "react-i18next";
import { LinearProgress } from "@mui/material";
import { usePasswordStrength } from "@/composables/use-passwords";

export default function UserPasswordStrength() {
  const { t } = useTranslation();

  const modelValue = defineModel<string>({ default: "" });
  const i18n = useI18n();

  const pwStrength = usePasswordStrength(modelValue, i18n);

  return (
    <>
  <div className="d-flex pb-6 mt-n1 ml-10">
    <div style="flex-basis: 500px">
      <strong>
        {t("user.password-strength", { strength: pwStrength.strength })}
      </strong>
      {/* WF4-REVIEW: v-model on complex expression "pwStrength.score" [J] */}
      <LinearProgress {/* WF4-REVIEW: v-model pwStrength.score */} rounded color={pwStrength.color} height="15" />
    </div>
  </div>
    </>
  );
}
