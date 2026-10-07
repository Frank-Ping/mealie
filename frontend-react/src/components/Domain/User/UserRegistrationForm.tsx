import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, CardHeader, Divider, FormControlLabel, TextField, form } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { validators } from "@/composables/use-validators";
import { useUserRegistrationForm } from "@/composables/use-users/user-registration-form";
import { usePasswordField } from "@/composables/use-passwords";
import UserPasswordStrength from "@/components/Domain/User/UserPasswordStrength";

export const handle = { layout: "blank" }; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function UserRegistrationForm({ onUpdate:modelValue }: Props) {
  const { t } = useTranslation();

  const inputAttrs = {
    validateOnBlur: true,
    class: "pb-1",
    variant: "solo-filled" as any,
  };
  const emit = /* emits → props: onUpdate:modelValue */
  const [isFormValid, setIsFormValid] = useState(false);

  const pwFields = usePasswordField();
  const {
    accountDetails,
    credentials,
    emailErrorMessages,
    usernameErrorMessages,
    validateUsername,
    validateEmail,
    domAccountForm,
  } = useUserRegistrationForm();
  /* WF4-REVIEW [J] */ watch(
    isFormValid,
    (val) => {
      emit("update:modelValue", val);
    },
    { immediate: true },
  );

  return (
    <>
  <div>
    {/* WF4-REVIEW: title text moves to the title prop */}
    <CardHeader className="pt-0">
      {/* WF4-REVIEW: icon name resolves via lib/icons */}
      <MdiIcon name={$globals.icons.user} size="large" className="mr-3" />
      <span className="headline">
        {t("user-registration.account-details")}
      </span>
    </CardHeader>
    <Divider />
    <CardContent className="mt-2">
      {/* WF4-REVIEW: validation semantics [J] */}
      <form ref="domAccountForm" value={isFormValid} onChange={setIsFormValid} onSubmit={(e) => { e.preventDefault(); ; }}>
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "accountDetails.username" [J] */}
        <TextField {/* WF4-REVIEW: v-model accountDetails.username */} autofocus {...(inputAttrs)} label={t('user.username')} prepend-icon={$globals.icons.user} rules={[validators.required]} error-messages={usernameErrorMessages} onBlur={validateUsername} />
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "accountDetails.fullName" [J] */}
        <TextField {/* WF4-REVIEW: v-model accountDetails.fullName */} {...(inputAttrs)} label={t('user.full-name')} prepend-icon={$globals.icons.user} rules={[validators.required]} />
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "accountDetails.email" [J] */}
        <TextField {/* WF4-REVIEW: v-model accountDetails.email */} {...(inputAttrs)} prepend-icon={$globals.icons.email} label={t('user.email')} rules={[validators.required, validators.email]} error-messages={emailErrorMessages} onBlur={validateEmail} />
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "credentials.password1" [J] */}
        <TextField {/* WF4-REVIEW: v-model credentials.password1 */} {...(inputAttrs)} type={pwFields.inputType} append-inner-icon={pwFields.passwordIcon} prepend-icon={$globals.icons.lock} label={t('user.password')} rules={[validators.required, validators.minLength(8), validators.maxLength(258)]} onClickAppendInner={pwFields.togglePasswordShow} />
        {/* WF4-REVIEW: v-model on complex expression "credentials.password1" [J] */}
        <UserPasswordStrength {/* WF4-REVIEW: v-model credentials.password1 */} />
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "credentials.password2" [J] */}
        <TextField {/* WF4-REVIEW: v-model credentials.password2 */} {...(inputAttrs)} type={pwFields.inputType} append-inner-icon={pwFields.passwordIcon} prepend-icon={$globals.icons.lock} label={t('user.confirm-password')} rules={[validators.required, credentials.passwordMatch]} onClickAppendInner={pwFields.togglePasswordShow} />
        <div className="px-2">
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "accountDetails.advancedOptions" [J] */}
          <FormControlLabel {/* WF4-REVIEW: v-model accountDetails.advancedOptions */} label={t('user.enable-advanced-content')} />
          <p className="text-caption mt-n4">
            {t("user.enable-advanced-content-description")}
          </p>
        </div>
      </form>
    </CardContent>
  </div>
    </>
  );
}
