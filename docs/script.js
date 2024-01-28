document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('myChart');
  const below = (ctx, value) => ctx.p1.parsed.y < 7 ? value : undefined;
  const above = (ctx, value) => ctx.p1.parsed.y > 13 ? value : undefined;

  const data = {
    datasets: [{
      data: [],
      fill: true,
      tension: 0.4,
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

function connect(obj) {
  var that = obj
  var ws = new WebSocket('ws://localhost:65432');
  ws.onmessage = function(event) {
    //console.log('Message:', event.data);
    that.msg(JSON.parse(event.data))
  };

  ws.onclose = function(event) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
    setTimeout(function() {
      connect(that);
    }, 1000);
  };

  ws.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };
}
document.addEventListener('alpine:init', () => {
  var cntr = 0;
  Alpine.data('ragnarock', () => ({
    combos: {
      count: 0,
      progress: 0,
      needed: 15,
    },
    song: {
      band: "",
      name: ""
    },
    speed: 10,
    max_speed: 10,
    messages: [],
    last_event: {},
    chart_updater: null,
    init() {
      reset()
      connect(this)
      this.$watch('speed', (value) => addData(window.chart, 0, value));
      this.$watch('speed', (value) => this.max_speed = this.max_speed < value ? value: this.max_speed);
    },
    msg(event) {
      //this.messages.push(JSON.stringify(event))
      //console.log(event.event)
      switch(event.event) {
        case "ragnarockInitConnection":
          this.reset();
          this.song = {name:"", band: ""}
          break;
        case "StartSong":
          this.reset();
          this.song.name = event.data.SongName
          this.song.band = event.data.SongBand
          break;
        case "BeatHit":
          if (Math.abs(event.data.delta)*1000 <= 15) {
            this.perfect()
            this.last_event[cntr] = "perfect"
          } else {
            this.correct()
            this.last_event[cntr] = "correct"
          }
          break;
        case "BeatMiss":
          this.miss();
          this.last_event[cntr] = "miss"
          break;
        case "ComboTriggered": 
          this.combo(event.data.level)
          this.last_event[cntr] = "combo"
          break;
        case "EndSong":
          this.stop();
          break;
        case "Score":
          //{"event": "Score", "data": {"stats":{"PercentageOfPerfects":47,"ComboBlue":1,"ComboYellow":2,"Missed":1,"Hit":215,"HitPercentage":99,"HitDeltaAverage":-14},"extra":{},"distance":"1659.772217"}}
          break;
      }
      setTimeout(function(struct, cnt) {
        delete struct.last_event[cnt]
      }, 600, this, cntr)
      cntr++;
    },
    restore_speed (speed_diff) {
      this.speed = +((this.speed - speed_diff).toFixed(1));
    },

    reset() {
      clearData(window.chart);
      this.speed = 10;
      this.max_speed = this.speed;
      this.last_event = {}
      this.combos.count = 0;
      this.reset_progress()
      this.stop();
      this.chart_updater = setInterval(function(that) {
        that.update_chart();
      }, 50, this);
    },
    reset_progress() {
      this.combos.progress = 0
      this.combos.needed = 15 + 10 * this.combos.count
    },
    stop() {
      if (this.chart_updater) clearInterval(this.chart_updater);
    },
    miss() {
      this.combos.progress = 0;
      var diff = +((this.speed/4.0).toFixed(1));
      this.speed -= diff;
      setTimeout(() => this.restore_speed(-diff), 300);
    },

    add_point(point){
      this.combos.progress += point;
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
    combo(lvl) {
      if (lvl == undefined) {
        if (this.is_lvl1_ready() == false) {
          return;
        }
        if (this.is_lvl2_ready()) {
          lvl = 2
        } else {
          lvl = 1
        }
      }
      var diff = +((this.speed * 3.0 / 4).toFixed(1));
      var time = 1000;
      if (lvl == 2) {
        time = 4000;
      }
      this.speed += diff;
      setTimeout(() => this.restore_speed(diff), time);
      this.combos.count++;
      this.reset_progress()
    },
    lvl1_percent() {
      return this.combos.progress / this.combos.needed * 100;
    },
    lvl2_percent() {
      return (this.combos.progress - this.combos.needed) / (this.combos.needed) * 100;
    },
    is_lvl1_ready() {
      return this.combos.progress >= this.combos.needed
    },
    is_lvl2_ready() {
      return this.combos.progress >= this.combos.needed * 2
    },
    lvl_class() {
      return (this.is_lvl2_ready() ? "lvl2-ready" : (this.is_lvl1_ready() ? "lvl1-ready" : ""));
    }
  }));
})
