nv.models.turnLineWithFocusChart = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var lines = nv.models.line()
        , lines2 = nv.models.line()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , x2Axis = nv.models.axis()
        , y2Axis = nv.models.axis()
        , y3Axis = nv.models.axis()
        , legend = nv.models.legend()
        , brush = d3.svg.brush()
        ;

    var margin = {top: 30, right: 30, bottom: 30, left: 60}
        , margin2 = {top: 0, right: 30, bottom: 20, left: 60}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , contextHeight = 100
        , x
        , y
        , x2
        , y2
        , y3
        , showLegend = true
        , brushExtent = null
        , tooltips = true
        , tooltip = function(key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' +  y + ' at ' + x + '</p>'
        }
        , noData = "No Data Available."
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'brush', 'stateChange', 'changeState')
        , transitionDuration = 250
        , state = nv.utils.state()
        , defaultState = null
        , showY2Axis = true
        , showY3Axis = true
        , defaultMetric = null
        , contextEnable = true
        ;

    lines
        .clipEdge(true)
    ;
    lines2
        .interactive(false)
    ;
    xAxis
        .orient('bottom')
        .tickPadding(5)
    ;
    yAxis
        .orient('left')
    ;
    x2Axis
        .orient('bottom')
        .tickPadding(5)
    ;
    y2Axis
        .orient('left')
    ;
    y3Axis
    	.orient('right')
    ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function(e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, null, null, offsetElement);
    };

    var stateGetter = function(data) {
        return function(){
            return {
                active: data.map(function(d) { return !d.disabled })
            };
        }
    };

    var stateSetter = function(data) {
        return function(state) {
            if (state.active !== undefined)
                data.forEach(function(series,i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        selection.each(function(data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width  || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight1 = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom - (contextEnable ? contextHeight : 0),
                availableHeight2 = contextHeight - margin2.top - margin2.bottom;

            chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function(d) { return !!d.disabled });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight1 / 2)
                    .text(function(d) { return d });

                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = lines.xScale();
            y = lines.yScale();
            x2 = lines2.xScale();
            y2 = lines2.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-lineWithFocusChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineWithFocusChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-legendWrap');

            var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
            focusEnter.append('g').attr('class', 'nv-x nv-axis');
            focusEnter.append('g').attr('class', 'nv-y nv-axis');
            focusEnter.append('g').attr('class', 'nv-y3 nv-axis');
            focusEnter.append('g').attr('class', 'nv-linesWrap');

            var contextEnter = gEnter.append('g').attr('class', 'nv-context');
            contextEnter.append('g').attr('class', 'nv-x nv-axis');
            contextEnter.append('g').attr('class', 'nv-y nv-axis');
            contextEnter.append('g').attr('class', 'nv-linesWrap');
            contextEnter.append('g').attr('class', 'nv-brushBackground');
            contextEnter.append('g').attr('class', 'nv-x nv-brush');

            // Legend
            if (showLegend) {
                legend.width(availableWidth);

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if ( margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight1 = (height || parseInt(container.style('height')) || 400)
                        - margin.top - margin.bottom - contextHeight;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) +')')
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Main Chart Component(s)
            // hide or show the focus context chart
            g.select('.nv-context').style('display', contextEnable ? 'initial' : 'none');
            
            lines
                .width(availableWidth)
                .height(availableHeight1)
                .color(
                data
                    .map(function(d,i) {
                        return d.color || color(d, i);
                    })
                    .filter(function(d,i) {
                        return !data[i].disabled;
                    })
            );

            lines2
                .defined(lines.defined())
                .width(availableWidth)
                .height(availableHeight2)
                .color(
                data
                    .map(function(d,i) {
                        return d.color || color(d, i);
                    })
                    .filter(function(d,i) {
                        return !data[i].disabled;
                    })
            );

            g.select('.nv-context')
                .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')')

            var contextLinesWrap = g.select('.nv-context .nv-linesWrap')
                .datum(data.filter(function(d) { return defaultMetric ? d.key === defaultMetric: !d.disabled }))

            d3.transition(contextLinesWrap).call(lines2);

            // Setup Main (Focus) Axes
            xAxis
                .scale(x)
                .ticks( nv.utils.calcTicksX(availableWidth/100, data) )
                .tickSize(-availableHeight1, 0);

            yAxis
                .scale(y)
                .ticks( nv.utils.calcTicksY(availableHeight1/36, data) )
                .tickSize( -availableWidth, 0);
            
            y3Axis
	            .scale(y)
	            .ticks( nv.utils.calcTicksY(availableHeight1/36, data) )
	            .tickSize( -availableWidth, 0);


            var indexLine = g.select('.nv-focus .nv-linesWrap').selectAll('.nv-indexLine').data([21]);

            indexLine.enter().append('rect').attr('class', 'nv-indexLine')
                .attr('width', 3)
                .attr('x', 45)
                .attr('fill', 'red')
                .attr('fill-opacity', .5)
                .attr('transform', function(d) { return 'translate(21,200)' })
                .attr('height', 250)
                .style("pointer-events","all");
            
            g.select('.nv-focus .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + availableHeight1 + ')');

            // Setup Brush
            brush
                .x(x2)
                .on('brush', function() {
                    //When brushing, turn off transitions because chart needs to change immediately.
                    var oldTransition = chart.duration();
                    chart.duration(0);
                    onBrush();
                    chart.duration(oldTransition);
                });

            if (brushExtent) brush.extent(brushExtent);

            var brushBG = g.select('.nv-brushBackground').selectAll('g')
                .data([brushExtent || brush.extent()])

            var brushBGenter = brushBG.enter()
                .append('g');

            brushBGenter.append('rect')
                .attr('class', 'left')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            brushBGenter.append('rect')
                .attr('class', 'right')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            var gBrush = g.select('.nv-x.nv-brush')
                .call(brush);
            gBrush.selectAll('rect')
                //.attr('y', -5)
                .attr('height', availableHeight2);
            gBrush.selectAll('.resize').append('path').attr('d', resizePath);

            onBrush();

            // Setup Secondary (Context) Axes
            x2Axis
                .scale(x2)
                .ticks( nv.utils.calcTicksX(availableWidth/100, data) )
                .tickSize(-availableHeight2, 0);

            g.select('.nv-context .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + y2.range()[0] + ')');
            d3.transition(g.select('.nv-context .nv-x.nv-axis'))
                .call(x2Axis);
            
            if(showY2Axis) {
            	y2Axis
                .scale(y2)
                .ticks( nv.utils.calcTicksY(availableHeight2/36, data) )
                .tickSize( -availableWidth, 0);

            	d3.transition(g.select('.nv-context .nv-y.nv-axis'))
                	.call(y2Axis);
            }
            
            g.select('.nv-context .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + y2.range()[0] + ')');
            
            g.select('.nv-focus .nv-y3.nv-axis')
				.attr('transform', 'translate(' + availableWidth + ', '+ 0 +')');

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function(newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            dispatch.on('tooltipShow', function(e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            dispatch.on('changeState', function(e) {
                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function(series,i) {
                        series.disabled = e.disabled[i];
                    });
                }
                chart.update();
            });

            //============================================================
            // Functions
            //------------------------------------------------------------

            // Taken from crossfilter (http://square.github.com/crossfilter/)
            function resizePath(d) {
                var e = +(d == 'e'),
                    x = e ? 1 : -1,
                    y = availableHeight2 / 3;
                return 'M' + (.5 * x) + ',' + y
                    + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
                    + 'V' + (2 * y - 6)
                    + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
                    + 'Z'
                    + 'M' + (2.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8)
                    + 'M' + (4.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8);
            }


            function updateBrushBG() {
                if (!brush.empty()) brush.extent(brushExtent);
                brushBG
                    .data([brush.empty() ? x2.domain() : brushExtent])
                    .each(function(d,i) {
                        var leftWidth = x2(d[0]) - x.range()[0],
                            rightWidth = x.range()[1] - x2(d[1]);
                        d3.select(this).select('.left')
                            .attr('width',  leftWidth < 0 ? 0 : leftWidth);

                        d3.select(this).select('.right')
                            .attr('x', x2(d[1]))
                            .attr('width', rightWidth < 0 ? 0 : rightWidth);
                    });
            }


            function onBrush() {
            	//This is just static thing we will make this dynamic
            	brushExtent = brush.empty() ? null : brush.extent();
                var extent = brush.empty() ? x2.domain() : brush.extent();
                
                //The brush extent cannot be less than one.  If it is, don't update the line chart.
                if (Math.abs(extent[0] - extent[1]) <= 1) {
                    return;
                }
                
                dispatch.brush({extent: extent, brush: brush});

                updateBrushBG();
                // Update Main (Focus)
                var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
                    .datum(
                    data
                        .filter(function(d) { return !d.disabled && d.key !== defaultMetric})
                        .map(function(d,i) {
                            return {
                                key: d.key,
                                area: d.area,
                                values: d.values.filter(function(d,i) {
                                    return lines.x()(d,i) >= extent[0] && lines.x()(d,i) <= extent[1];
                                })
                            }
                        })
                );
                focusLinesWrap.transition().duration(transitionDuration).call(lines);


                // Update Main (Focus) Axes
                g.select('.nv-focus .nv-x.nv-axis').transition().duration(transitionDuration)
                    .call(xAxis);
                g.select('.nv-focus .nv-y.nv-axis').transition().duration(transitionDuration)
                    .call(yAxis);
                
                if(showY3Axis) {
                	g.select('.nv-focus .nv-y3.nv-axis').transition().duration(transitionDuration)
                		.call(y3Axis);
                }
            }
        });

        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    lines.dispatch.on('elementMouseover.tooltip', function(e) {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines.dispatch.on('elementMouseout.tooltip', function(e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function() {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.legend = legend;
    chart.lines = lines;
    chart.lines2 = lines2;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.x2Axis = x2Axis;
    chart.y2Axis = y2Axis;
    chart.y3Axis = y3Axis;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width:      {get: function(){return width;}, set: function(_){width=_;}},
        height:     {get: function(){return height;}, set: function(_){height=_;}},
        showLegend: {get: function(){return showLegend;}, set: function(_){showLegend=_;}},
        brushExtent: {get: function(){return brushExtent;}, set: function(_){brushExtent=_;}},
        tooltips:    {get: function(){return tooltips;}, set: function(_){tooltips=_;}},
        tooltipContent:    {get: function(){return tooltip;}, set: function(_){tooltip=_;}},
        defaultState:    {get: function(){return defaultState;}, set: function(_){defaultState=_;}},
        noData:    {get: function(){return noData;}, set: function(_){noData=_;}},

        // options that require extra logic in the setter
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = _.top    !== undefined ? _.top    : margin.top;
            margin.right  = _.right  !== undefined ? _.right  : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left   = _.left   !== undefined ? _.left   : margin.left;
        }},
        color:  {get: function(){return color;}, set: function(_){
            color = nv.utils.getColor(_);
            legend.color(color);
            // line color is handled above?
        }},
        interpolate: {get: function(){return lines.interpolate();}, set: function(_){
            lines.interpolate(_);
            lines2.interpolate(_);
        }},
        xTickFormat: {get: function(){return xAxis.xTickFormat();}, set: function(_){
            xAxis.tickFormat(_);
            x2Axis.tickFormat(_);
        }},
        yTickFormat: {get: function(){return yAxis.yTickFormat();}, set: function(_){
            yAxis.tickFormat(_);
            y2Axis.tickFormat(_);
        }},
        duration:    {get: function(){return transitionDuration;}, set: function(_){
            transitionDuration=_;
            yAxis.duration(transitionDuration);
            xAxis.duration(transitionDuration);
        }},
        x: {get: function(){return lines.x();}, set: function(_){
            lines.x(_);
            lines2.x(_);
        }},
        y: {get: function(){return lines.y();}, set: function(_){
            lines.y(_);
            lines2.y(_);
        }},
        showY2Axis:    {get: function(){return showY2Axis;}, set: function(_){showY2Axis=_;}},
        showY3Axis:    {get: function(){return showY3Axis;}, set: function(_){showY3Axis=_;}},
        defaultMetric: {get: function(){return defaultMetric;}, set: function(_){defaultMetric=_;}},
        contextEnable:    {get: function(){return contextEnable;}, set: function(_){contextEnable=_;}},
        contextHeight:    {get: function(){return contextHeight;}, set: function(_){contextHeight=_;}}
    });

    nv.utils.inheritOptions(chart, lines);
    nv.utils.initOptions(chart);

    return chart;
};
