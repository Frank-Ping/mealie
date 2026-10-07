import { useMemo, useState } from "react";
import { icons } from "@/lib/icons";
import type { VueI18n } from "vue-i18n";
import { scorePassword } from "@/lib/validators";

export function usePasswordField() {
  const [show, setShow] = useState(false);
  // icons imported directly (was $globals)

  const passwordIcon = computed(() => {
    return show ? icons.eyeOff : icons.eye;
  });
  const inputType = useMemo(() => (show ? "text" : "password", []); // WF4-REVIEW: dependency array);

  const togglePasswordShow = () => {
    setShow(!show);
  };

  return {
    inputType,
    togglePasswordShow,
    passwordIcon,
  };
}

export const usePasswordStrength = (password: string /* WF4-REVIEW: was Ref */, i18n: VueI18n) => {
  const score = useMemo(() => scorePassword(password, []); // WF4-REVIEW: dependency array);
  const strength = useMemo(() =>  {
    if (score < 50, []); // WF4-REVIEW: dependency array {
      return i18n.t("user.password-strength-values.weak");
    }
    else if (score < 80) {
      return i18n.t("user.password-strength-values.good");
    }
    else if (score < 100) {
      return i18n.t("user.password-strength-values.strong");
    }
    else {
      return i18n.t("user.password-strength-values.very-strong");
    }
  });

  const color = useMemo(() =>  {
    if (score < 50, []); // WF4-REVIEW: dependency array {
      return "error";
    }
    else if (score < 80) {
      return "warning";
    }
    else if (score < 100) {
      return "info";
    }
    else {
      return "success";
    }
  });

  return { score, strength, color };
};
