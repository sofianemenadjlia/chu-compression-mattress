// vue.config.js
module.exports = {
    // options...
    pages:{
        index:{
            entry:      'src/index/main.js',
            template:   'public/index.html',
            filename:   'index.html',
            title:      'CHU-D:Home',
        },
        booking:{
            entry:      'src/booking/main.js',
            template:   'public/index.html',
            filename:   'booking.html',
            title:      'CHU-D:Booking'
        },
        management:{
            entry:      'src/management/main.js',
            template:   'public/index.html',
            filename:   'management.html',
            title:      'CHU-D:Management'
        },
        stats:{
            entry:      'src/stats/main.js',
            template:   'public/index.html',
            filename:   'stats.html',
            title:      'CHU-D:Stats'
        },
        history:{
            entry:      'src/history/main.js',
            template:   'public/index.html',
            filename:   'history.html',
            title:      'CHU-D:History'
        }
    },

    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true
            }
        }
    }
}
  