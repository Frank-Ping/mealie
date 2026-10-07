import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Grid, TextField, form } from "@mui/material";
import { useUserApi } from "@/composables/api";
import BaseDialog from "@/components/global/BaseDialog";
import AppButtonCopy from "@/components/global/AppButtonCopy";
import BaseButton from "@/components/global/BaseButton";
import { validators } from "@/composables/use-validators";
import { alert } from "@/composables/use-toast";
import type { GroupInDB } from "@/lib/api/types/user";
import type { HouseholdInDB } from "@/lib/api/types/household";
import { useGroups } from "@/composables/use-groups";
import { useAdminHouseholds } from "@/composables/use-households";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function UserInviteDialog() {
  const { t } = useTranslation();

  const inviteDialog = defineModel<boolean>("modelValue", { type: Boolean, default: false });

  const i18n = useI18n();
  const auth = useMealieAuth();

  const isAdmin = auth.user?.admin; // was computed — plain read stays reactive
  const [token, setToken] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [groups, setGroups] = useState([]);
  const [households, setHouseholds] = useState([]);
  const api = useUserApi();

  const fetchGroupsAndHouseholds = () => {
    if (isAdmin) {
      const groupsResponse = useGroups();
      const householdsResponse = useAdminHouseholds();
      /* WF4-REVIEW [J] */ watchEffect(() => {
        setGroups(groupsResponse.groups || []);
        setHouseholds(householdsResponse.households || []);
      });
    }
  };

  async function getSignupLink(group: string | null = null, household: string | null = null) {
    const payload = (group && household) ? { uses: 1, group_id: group, household_id: household } : { uses: 1 };
    const { data } = await api.households.createInvitation(payload);
    if (data) {
      setToken(data.token);
    }
  }

  const filteredHouseholds = useMemo(() =>  {
    if (!selectedGroup, []); // WF4-REVIEW: dependency array return [];
    return households?.filter(household => household.groupId === selectedGroup);
  });

  function constructLink(tokenVal: string) {
    return tokenVal ? `${window.location.origin}/register?token=${tokenVal}` : "";
  }

  const generatedSignupLink = useMemo(() => constructLink(token, []); // WF4-REVIEW: dependency array);

  // Email Invitation
  const state = /* WF4-REVIEW [J] */ reactive({
    loading: false,
    sendTo: "",
  });
  const { loading, sendTo } = toRefs(state);

  async function sendInvite() {
    state.loading = true;
    if (!token) {
      getSignupLink(selectedGroup, selectedHousehold);
    }
    const { data } = await api.email.sendInvitation({
      email: state.sendTo,
      token: token,
    });

    if (data && data.success) {
      alert.success(i18n.t("profile.email-sent"));
    }
    else {
      alert.error(i18n.t("profile.error-sending-email"));
    }
    state.loading = false;
    inviteDialog = false;
  }

  const validEmail = useMemo(() =>  {
    if (sendTo === "", []); // WF4-REVIEW: dependency array return false;
    const valid = validators.email(sendTo);
    return valid === true;
  });

  // Watchers (replacing options API watchers)
  /* WF4-REVIEW [J] */ watch(inviteDialog, (val) => {
    if (val && !isAdmin) {
      getSignupLink();
    }
  });

  /* WF4-REVIEW [J] */ watch(selectedHousehold, (newVal) => {
    if (newVal && selectedGroup) {
      getSignupLink(selectedGroup, selectedHousehold);
    }
  });

  // initial fetch
  fetchGroupsAndHouseholds();

  return (
    <>
  <BaseDialog value={inviteDialog} onChange={/* WF4-REVIEW: setter */ setInviteDialog} title={t('profile.get-invite-link')} icon={$globals.icons.accountPlusOutline} color="primary">
    <Container>
      {/* WF4-REVIEW: validation semantics [J] */}
      <form className="mt-5">
        {(groups && groups.length) ? (
          /* WF4-REVIEW: items/item-title/item-value → MenuItem children */
          <TextField select value={selectedGroup} onChange={setSelectedGroup} items={groups} item-title="name" item-value="id" return-object={false} variant="filled" label={t('group.user-group')} rules={[validators.required]} />
        ) : null}
        {(households && households.length) ? (
          /* WF4-REVIEW: items/item-title/item-value → MenuItem children */
          <TextField select value={selectedHousehold} onChange={setSelectedHousehold} items={filteredHouseholds} item-title="name" item-value="id" return-object={false} variant="filled" label={t('household.user-household')} rules={[validators.required]} />
        ) : null}
        <Grid container>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="9">
            {/* WF4-REVIEW: rules/error-messages → error+helperText */}
            <TextField value={generatedSignupLink} onChange={/* WF4-REVIEW: setter */ setGeneratedSignupLink} label={t('profile.invite-link')} type="text" readonly variant="filled" />
          </Grid>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="3" className="pl-1 mt-3">
            <AppButtonCopy icon={false} color="info" copy-text={generatedSignupLink} />
          </Grid>
        </Grid>
        {/* WF4-REVIEW: rules/error-messages → error+helperText */}
        <TextField value={sendTo} onChange={/* WF4-REVIEW: setter */ setSendTo} label={t('user.email')} rules={[validators.email]} variant="outlined" onKeyDown={sendInvite} />
      </form>
    </Container>
    <template>
      <BaseButton disabled={!validEmail} loading={loading} icon={$globals.icons.email} onClick={sendInvite}>
        {t("group.invite")}
      </BaseButton>
    </template>
  </BaseDialog>
    </>
  );
}
