const path = require('path');
const glob = require('glob');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const BundleTracker = require('webpack-bundle-tracker');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';
    const isWatching = argv.watch;

    const entries = glob.sync('./apps/static/assets/dist/**/*.@(js|css)').reduce((acc, path) => {
        const entry = path.replace(/^.*[\\\/]/, '').replace(/\.(js|css)$/, '');
        acc[entry] = './' + path.slice(0);
        return acc;
    }, {});

    const plugins = [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: isProd ? '[name].[contenthash].css' : '[name].css'
        }),
        new BundleTracker({ path: __dirname, filename: 'webpack-stats.json' }),
    ];

    if (isProd) {
        plugins.push(
            new CompressionPlugin({
                test: /\.(js|css|html|svg)$/,
                algorithm: 'gzip',
                threshold: 10240,
                minRatio: 0.8,
            }),
        );
    }

    if (isWatching) {
        plugins.push(
            new BundleAnalyzerPlugin(),
        );
    }

    return {
        // To bundle every static files
        // entry: entries,
        entry: {
            index: './apps/static/assets/dist/js/index.js',
            map_and_layers_retriever: './apps/static/assets/dist/js/map_and_layers_retriever.js',
            dropdown_filter: './apps/static/assets/dist/js/dropdown_filter.js',
            dropdown: './apps/static/assets/dist/js/dropdown.js',
        },
        output: {
            filename: isProd ? '[name].[contenthash].js' : '[name].js',
            path: path.resolve(__dirname, './apps/static/assets/js'),
            publicPath: '/static/assets/js/',
            assetModuleFilename: 'img/[hash][ext][query]'
        },
        devtool: isProd ? 'source-map' : 'inline-source-map',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        isProd ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader',
                        'sass-loader',
                    ],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
            ],
        },
        plugins: plugins,
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
                new CssMinimizerPlugin(),
            ],
            splitChunks: {
                chunks: 'all',
                // minSize: 20000,
                // maxSize: 70000,
                minChunks: 1,
                maxAsyncRequests: 30,
                maxInitialRequests: 30,
                automaticNameDelimiter: '~',
                cacheGroups: {
                    defaultVendors: {
                        test: /[\/]node_modules[\/]/,
                        priority: -10,
                        reuseExistingChunk: true,
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            },
        },
        performance: {
            hints: isProd ? 'warning' : false,
        },
    };
};