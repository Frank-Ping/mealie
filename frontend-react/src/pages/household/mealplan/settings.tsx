import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Card, CardActions, CardContent, CardHeader, Chip, Container, Divider } from "@mui/material";
import { useUserApi } from "@/composables/api";
import type { PlanRulesCreate, PlanRulesOut } from "@/lib/api/types/meal-plan";
import GroupMealPlanRuleForm from "@/components/Domain/Household/GroupMealPlanRuleForm";
import { useAsyncKey } from "@/composables/use-utils";
import RecipeChips from "@/components/Domain/Recipe/RecipeChips";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Settings() {
  const { t } = useTranslation();

  const api = useUserApi();
  const i18n = useI18n();

  useSeoMeta({
    title: i18n.t("meal-plan.meal-plan-settings"),
  });

  // ======================================================
  // Manage All
  const [editState, setEditState] = useState({});
  const [allRules, setAllRules] = useState([]);

  function toggleEditState(id: string) {
    editState[id] = !editState[id];
    setEditState({ ...editState });
  }

  async function refreshAll() {
    const { data } = await api.mealplanRules.getAll();

    if (data) {
      setAllRules(data.items ?? []);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshAll();
        if (cancelled) return;
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  // ======================================================
  // Creating Rules

  const [createDataFormKey, setCreateDataFormKey] = useState(0);
  const [createData, setCreateData] = useState({
    entryType: "unset",
    day: "unset",
    queryFilterString: "",
  });

  async function createRule() {
    const { data } = await api.mealplanRules.createOne(createData);
    if (data) {
      refreshAll();
      setCreateData({
        entryType: "unset",
        day: "unset",
        queryFilterString: "",
      });
      createDataFormKey++;
    }
  }

  async function deleteRule(ruleId: string) {
    const { data } = await api.mealplanRules.deleteOne(ruleId);
    if (data) {
      refreshAll();
    }
  }

  async function updateRule(rule: PlanRulesOut) {
    const { data } = await api.mealplanRules.updateOne(rule.id, rule);
    if (data) {
      refreshAll();
      toggleEditState(rule.id);
    }
  }

  return (
    <>
  <Container className="lg-container">
    <BasePageTitle divider>
      <template>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="100" max-width="100" src="/svgs/manage-cookbooks.svg" />
      </template>
      <template>
        {t('meal-plan.meal-plan-rules')}
      </template>
      {t('meal-plan.meal-plan-rules-description')}
    </BasePageTitle>
    <Card>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="headline">
        {t('meal-plan.new-rule')}
      </CardHeader>
      <Divider className="mx-2" />
      <CardContent>
        {t('meal-plan.new-rule-description')}
        {/* WF4-REVIEW: v-model on complex expression "createData.day" [J]; v-model on complex expression "createData.entryType" [J]; v-model on complex expression "createData.queryFilterString" [J] */}
        <GroupMealPlanRuleForm key={createDataFormKey} {/* WF4-REVIEW: v-model createData.day */} {/* WF4-REVIEW: v-model createData.entryType */} {/* WF4-REVIEW: v-model createData.queryFilterString */} className="mt-2" />
      </CardContent>
      <CardActions className="justify-end">
        <BaseButton create disabled={!createData.queryFilterString} onClick={createRule} />
      </CardActions>
    </Card>
    <section>
      <BaseCardSectionTitle className="mt-10" title={t('meal-plan.recipe-rules')} />
      <div>
        {allRules.map((rule, idx) => (
          <div key={rule.id}>
            <Card className="my-2 left-border">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="headline pb-1">
                {rule.day === "unset" ? t('meal-plan.applies-to-all-days') : t('meal-plan.applies-on-days', [rule.day])}
                {rule.entryType === "unset" ? t('meal-plan.for-all-meal-types') : t('meal-plan.for-type-meal-types', [rule.entryType])}
                <span className="ml-auto">
                  <BaseButtonGroup buttons={[
                    {
                      icon: $globals.icons.edit,
                      text: t('general.edit'),
                      event: 'edit',
                    },
                    {
                      icon: $globals.icons.delete,
                      text: t('general.delete'),
                      event: 'delete',
                    },
                  ]} onDelete={deleteRule(rule.id)} onEdit={toggleEditState(rule.id)} />
                </span>
              </CardHeader>
              <CardContent>
                {(!editState[rule.id]) ? (
                  <template>
                    {(rule.categories) ? (
                      <div>
                        <h4 className="py-1">
                          {t("category.categories")}
                          :
                        </h4>
                        {(rule.categories.length) ? (
                          <RecipeChips items={rule.categories} small className="pb-3" />
                        ) : (
                          /* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card-text> */
                          <CardContent label className="ma-0 px-0 pt-0 pb-3" text-color="accent" size="small">
                            {t("meal-plan.any-category")}
                          </CardContent>
                        )}
                      </div>
                    ) : null}
                    {(rule.tags) ? (
                      <div>
                        <h4 className="py-1">
                          {t("tag.tags")}
                          :
                        </h4>
                        {(rule.tags.length) ? (
                          <RecipeChips items={rule.tags} url-prefix="tags" small className="pb-3" />
                        ) : (
                          /* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card-text> */
                          <CardContent label className="ma-0 px-0 pt-0 pb-3" text-color="accent" size="small">
                            {t("meal-plan.any-tag")}
                          </CardContent>
                        )}
                      </div>
                    ) : null}
                    {(rule.households) ? (
                      <div>
                        <h4 className="py-1">
                          {t("household.households")}
                          :
                        </h4>
                        {(rule.households.length) ? (
                          <div>
                            {rule.households.map(household => (
                              /* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-chip> */
                              <Chip key={household.id} label className="ma-1" color="accent" size="small">
                                {household.name}
                              </Chip>
                            ))}
                          </div>
                        ) : (
                          /* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card-text> */
                          <CardContent label className="ma-0 px-0 pt-0 pb-3" text-color="accent" size="small">
                            {t("meal-plan.any-household")}
                          </CardContent>
                        )}
                      </div>
                    ) : null}
                  </template>
                ) : (
                  <template>
                    {/* WF4-REVIEW: v-model on complex expression "allRules[idx].day" [J]; v-model on complex expression "allRules[idx].entryType" [J]; v-model on complex expression "allRules[idx].queryFilterString" [J] */}
                    <GroupMealPlanRuleForm {/* WF4-REVIEW: v-model allRules[idx].day */} {/* WF4-REVIEW: v-model allRules[idx].entryType */} {/* WF4-REVIEW: v-model allRules[idx].queryFilterString */} query-filter={allRules[idx].queryFilter} />
                    <div className="d-flex justify-end">
                      <BaseButton update disabled={!allRules[idx].queryFilterString} onClick={updateRule(rule)} />
                    </div>
                  </template>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  </Container>
    </>
  );
}
