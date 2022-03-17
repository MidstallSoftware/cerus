<template>
  <div>
    <v-toolbar>
      <v-btn
        v-for="v in analyticsViews"
        :key="v"
        :color="makeColor(v)"
        depressed
        @click="changeView(v)"
      >
        {{ $t(`view.${v.toLowerCase()}`) }}
      </v-btn>
    </v-toolbar>
    <v-tabs-items v-model="viewIndex">
      <v-tab-item v-for="v in analyticsViews" :key="v">
        <v-sheet color="rgba(0, 0, 0, .12)">
          <v-sparkline
            :value="Object.values(analyticsData(v))"
            type="trend"
            color="rgb(255, 255, 255, .7)"
            height="25"
            label-size="3"
            padding="13"
            :labels="Object.keys(analyticsData(v))"
            line-width="1"
            smooth
          >
            <template #label="item">
              {{
                item.value +
                (analyticsData(v)[item.value] > 0
                  ? ` (${analyticsData(v)[item.value]})`
                  : '')
              }}
            </template>
          </v-sparkline>
        </v-sheet>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>
<i18n>
{
  "en": {
    "view.day": "Day",
    "view.week": "Week",
    "view.month": "Month",
    "view.year": "Year"
  }
}
</i18n>
<script lang="ts">
import { Component, Prop, VModel, Model, Vue } from 'vue-property-decorator'

export enum AnalyticsView {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export type GenData = (view: AnalyticsView) => Record<string, number>

@Component
export default class Analytics extends Vue {
  @Prop({
    default: AnalyticsView.WEEK,
  })
  @Model('update:view')
  view: AnalyticsView

  viewIndex: number = 1
  analyticsViews = Object.keys(AnalyticsView).filter((v) => isNaN(parseInt(v)))
  @VModel() analyticsData: GenData

  changeView(view: AnalyticsView) {
    this.view = view
    this.viewIndex = this.analyticsViews.findIndex((v) => v === view)
  }

  makeColor(view: AnalyticsView) {
    return this.view === view ? 'secondary' : 'normal'
  }
}
</script>
