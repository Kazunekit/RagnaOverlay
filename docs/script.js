document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('myChart');
  const below = (ctx, value) => ctx.p1.parsed.y < 7 ? value : undefined;
  const above = (ctx, value) => ctx.p1.parsed.y > 13 ? value : undefined;

  const data = {
    datasets: [{
      data: [],
      fill: true,
      tension: 0.2,
      spanGaps: true,
      borderColor: '#20bbff',
      segment: {
        borderColor: ctx => below(ctx, 'red') || above(ctx, '#00a20a')
      }
    }]
  };
  Chart._adapters._date.override({
    format: function(time, fmt) {
      return 0;
    }
  });
  window.chart = new Chart(ctx, {
    type: 'line',
    data,
    options: {
      hover: {
        mode: null
      },
      interaction: {
        mode: 'index',
      },
      maintainAspectRatio: false,
      animation: false,
      elements: {
        point: {
          radius: 0,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
          },
          display: false,
          grid: {},
          ticks: {
            display: false,
            source: 'labels',
          },
        },
        y: {
          display: false,
          min: 0,
          grid: {},
          suggestedMax: 20,
          ticks: {
            display: false,
            source: 'labels',
          }
        }
      }
    }
  });
});
function addData(chart, label, newData) {
  chart.data.labels.push(Date.now());
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(newData);
  });
  window.requestAnimationFrame(() => chart.update());
}

function removeData(chart) {
  chart.data.labels.pop();
  chart.data.datasets.forEach((dataset) => {
    dataset.data.pop();
  });
  window.requestAnimationFrame(() => chart.update())
}
function clearData(chart) {
  chart.data.labels.length = 0;
  chart.data.datasets.forEach((dataset) => {
    dataset.data.length = 0;
  });
  window.requestAnimationFrame(() => chart.update())

}
document.addEventListener('alpine:init', () => {
  var cntr = 0;
  Alpine.data('ragnarock', () => ({
    combos: {
      count: 0,
      lvl1: {
        on: false,
        progress: 0,
        needs: 15,
      },
      lvl2: {
        on: false,
        progress: 0,
      },
    },
    speed: 10,
    chart_updater: null,
    init() {
      this.$watch('speed', (value) => addData(window.chart, 0, value));
    },
    restore_speed (speed_diff) {
      this.speed = +((this.speed - speed_diff).toFixed(1));
    },

    reset() {
      clearData(window.chart);
      this.speed = 10;
      this.combos.count = 0;
      this.combos.lvl1.on = false;
      this.combos.lvl1.progress = 0;
      this.combos.lvl1.needs = 15;
      this.combos.lvl2.on = false;
      this.combos.lvl2.progress = 0;
      this.stop();
      this.chart_updater = setInterval(function(that) {
        that.update_chart();
      }, 50, this);

    },
    stop() {
      if (this.chart_updater) clearInterval(this.chart_updater);
    },
    miss() {
      this.combos.lvl1.on = false;
      this.combos.lvl1.progress = 0;
      this.combos.lvl2.on = false;
      this.combos.lvl2.progress = 0;
      var diff = +((this.speed/4.0).toFixed(1));
      this.speed -= diff;
      setTimeout(() => this.restore_speed(-diff), 300);
    },

    add_point(point){
      if (this.combos.lvl1.on == false) {
        this.combos.lvl1.progress += point;
        if (this.combos.lvl1.progress >= this.combos.lvl1.needs) {
          this.combos.lvl1.on = true;
        }
      } else if (this.combos.lvl2.on == false) {
        this.combos.lvl2.progress += point
        if (this.combos.lvl2.progress >= this.combos.lvl1.needs * 2) {
          this.combos.lvl2.on = true;
        }
      }
    },
    update_chart() {
      addData(window.chart, cntr++, this.speed);
    },
    correct(){
      this.add_point(0.5);
    },
    perfect() {
      this.add_point(1.0);
      var diff = +((this.speed/4.0).toFixed(1));
      this.speed += diff;
      setTimeout(() => this.restore_speed(diff), 300);
    },
    combo() {
      if (this.combos.lvl1.on == false && this.combos.lvl2.on == false) {
        return;
      }
      var diff = +((this.speed * 3.0 / 4).toFixed(1));
      var time = 1000;
      if (this.combos.lvl2.on == true) {
        time = 4000;
      }
      this.speed += diff;
      setTimeout(() => this.restore_speed(diff), time);
      this.combos.lvl1.on = false;
      this.combos.lvl1.progress = 0;
      this.combos.lvl2.on = false;
      this.combos.lvl2.progress = 0;
      this.combos.count++;
      this.combos.lvl1.needs = 15 + 10 * this.combos.count;
    },
    lvl1_percent() {
      return this.combos.lvl1.progress / this.combos.lvl1.needs * 100;
    },
    lvl2_percent() {
      return this.combos.lvl2.progress / (this.combos.lvl1.needs * 2) * 100;
    },
    lvl_class() {
      return (this.combos.lvl2.on ? "lvl2-ready" : (this.combos.lvl1.on ? "lvl1-ready" : ""));
    },
    lvl_class_toggle() {
      return (this.combos.lvl2.on ? "lvl2-ready" : (this.combos.lvl1.on && this.combos.lvl2.progress < 4 ? "lvl1-ready" : ""));
    }

  }));
  Alpine.store("position", {
    top: 0,
    left: 0,
    roll() {
      this.top = Math.floor(Math.random()*50);
      this.left = Math.floor(Math.random()*50);
    }
  });
  setInterval(function () {
    Alpine.store("position").roll();
  }, 500);
})
