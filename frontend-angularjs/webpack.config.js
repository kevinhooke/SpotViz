var webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/app/js/SpotVizApp.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    //added to additionally load angular heatmap from bower components
    resolve: {
        modules: ["node_modules", "bower_components"],
        descriptionFiles: ['package.json', 'bower.json'],
        //from: https://github.com/angular-ui/ui-date/issues/169
        alias: {
            'jquery-ui/datepicker': 'jquery-ui/ui/widgets/datepicker',
            'd3': path.resolve(__dirname, 'bower_components/d3/d3.js'),
            'cal-heatmap': path.resolve(__dirname, 'bower_components/cal-heatmap/cal-heatmap.js'),
            'angular-cal-heatmap': path.resolve(__dirname, 'bower_components/angular-cal-heatmap-directive/dist/1.3.0/calHeatmap.min.js')
        }
    },
    devtool: 'inline-source-map',
    devServer: {
        port: 8000
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                API_URL: JSON.stringify(process.env.API_URL),
            },
        }),
        new webpack.ProvidePlugin({
            'window.jQuery': 'jquery',
            $: "jquery",
            jQuery: "jquery",
            CalHeatMap: "cal-heatmap"
        }),
        new HtmlWebpackPlugin({template: './src/app/index.html'})
    ],
    module: {
        rules: [
            {
                test: /\.(s*)css$/,
                use: [
                    {
                        // Adds CSS to the DOM by injecting a `<style>` tag
                        loader: 'style-loader'
                    },
                    {
                        // Interprets `@import` and `url()` like `import/require()` and will resolve them
                        loader: 'css-loader'
                    },
                    {
                        // Loader for webpack to process CSS with PostCSS
                        loader: 'postcss-loader',
                        options: {
                            plugins: function () {
                                return [
                                    require('autoprefixer')
                                ];
                            }
                        }
                    },
                    {
                        // Loads a SASS/SCSS file and compiles it to CSS
                        loader: 'sass-loader'
                    }
                ]
            },
/*
            {
                test: /historyPlaybackControls\.html$/,
                use: [
                    {
                        //loader: ngTemplateLoader
                        loader: 'ngtemplate-loader?relativeTo=\' + __dirname + \'/\''
                        //loader: 'html'
                    }
                ],
            },
            {
                test: /visualizationPlayback\.html$/,
                use: [
                    {
                        //loader: ngTemplateLoader
                        loader: 'ngtemplate-loader?relativeTo=\' + __dirname + \'/app\''
                        //loader: 'html'
                    }
                ],
            },
*/
            {
                test: /\.html$/,
                use: [
                    { loader: 'html-loader' }
                ],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader'
                    }
                ],
            },
            {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            }
        ]
    }
};