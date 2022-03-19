<template>
  <div>
    <v-toolbar>
      <v-btn
        v-for="v in views"
        :key="v"
        :color="makeColor(string2view(v))"
        depressed
        @click="view = string2view(v)"
      >
        {{ $t(`view.${v.toLocaleLowerCase()}`) }}
      </v-btn>
    </v-toolbar>
    <v-tabs-items v-model="viewIndex">
      <v-tab-item v-for="v in views" :key="v">
        <v-sheet color="rgba(0, 0, 0, .12)">
          <apex-chart
            type="heatmap"
            height="350"
            :series="getSeries(string2view(v))"
            :options="getChartOptions(string2view(v))"
          />
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
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
  compareAsc,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  set,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { APIInteractionCall } from '~/api/types'

enum ViewType {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

type GetAnalytics = (view: ViewType) => APIInteractionCall[]
const GetAnalyticsDefault: GetAnalytics = () => []

@Component
export default class Analytics extends Vue {
  @Prop({ default: 0 }) viewIndex: number
  @Prop({ default: GetAnalyticsDefault }) getAnalytics: GetAnalytics

  get series() {
    return this.getSeries(this.view)
  }

  get view() {
    return Object.values(ViewType)[this.viewIndex]
  }

  set view(view: ViewType) {
    this.viewIndex = this.view2index(view)
  }

  string2view(str: string): ViewType {
    return Object.values(ViewType)[this.views.findIndex((v) => v === str)]
  }

  view2index(view: ViewType) {
    return Object.values(ViewType).findIndex((v) => v === view.toLowerCase())
  }

  getSeries(view: ViewType): object[] {
    const now = new Date()
    const data = this.getAnalytics(view).filter((entry) => {
      switch (view) {
        case ViewType.WEEK:
          return (
            compareAsc(startOfWeek(now), entry.timestamp) === -1 &&
            compareAsc(endOfWeek(now), entry.timestamp) === 1
          )
        case ViewType.MONTH:
          return (
            compareAsc(startOfMonth(now), entry.timestamp) === -1 &&
            compareAsc(endOfMonth(now), entry.timestamp) === 1
          )
        case ViewType.YEAR:
          return (
            compareAsc(startOfYear(now), entry.timestamp) === -1 &&
            compareAsc(endOfYear(now), entry.timestamp) === 1
          )
      }
      return false
    })

    switch (view) {
      case ViewType.WEEK:
        return new Array(7)
          .fill(0)
          .map((_value, i) => format(set(now, { date: i }), 'EEEE'))
          .reverse()
          .map((name, i) => ({
            name,
            data: data
              .filter(({ timestamp }) => timestamp.getDay() === i)
              .map((entry) => [entry.timestamp, entry.id]),
          }))
      case ViewType.MONTH:
        return new Array(4)
          .fill(0)
          .map((_value, i) => i + 1)
          .reverse()
          .map((name, i) => ({
            name,
            data: data
              .filter(({ timestamp }) => timestamp.getMonth() === i)
              .map((entry) => [entry.timestamp, entry.id]),
          }))
      case ViewType.YEAR:
        return new Array(12)
          .fill(0)
          .map((_value, i) => format(set(now, { month: i }), 'LLLL'))
          .reverse()
          .map((name, i) => ({
            name,
            data: data
              .filter(({ timestamp }) => timestamp.getMonth() === i)
              .map((entry) => [entry.timestamp, entry.id]),
          }))
    }
  }

  makeColor(view: ViewType) {
    return this.view === view ? 'secondary' : 'normal'
  }

  get views() {
    return Object.keys(ViewType).filter((v) => isNaN(parseInt(v)))
  }

  getChartOptions(view: ViewType) {
    const format = { week: 'HH:mm', month: 'dd', year: 'MMM dd' }[
      view.toLowerCase()
    ]
    return {
      chart: {
        height: 350,
        type: 'heatmap',
      },
      xaxis: {
        type: 'datetime',
        labels: {
          format,
        },
      },
      toolbar: {
        show: false,
      },
      colors: Object.keys(this.$vuetify.theme.currentTheme),
      tooltip: {
        x: {
          format,
        },
        y: {
          format,
        },
      },
      dataLabels: {
        enabled: false,
      },
    }
  }
}
</script>
