
const SvgSummaryChart = (props) => {
    const cw = props.containerWidth; // container width
    const ch = 60; // container height
    const vp = 5; // vertical padding
    const lp = 30; // left pad
    const rp = 5; // right pad


    const detailPoints = props.detailPoints;

    // set up y-axis
    const maximumIsZero = Math.max(...detailPoints) === 0 ? true : false;
    const maximumDetailPoint = Math.ceil(Math.max(...detailPoints));
    const pointOffset = (cw - lp - rp) / (detailPoints.length - 1);

    const MaximumYAxis = Math.round(
        Math.ceil(Math.pow(Math.sqrt(maximumDetailPoint * 1.1), 2) / 10) * 10
    );



    const borderStrokeColor = "rgb(178 179 175 / 0.4)";
    const borderStrokeWidth = 1;
    const areaChartFill = "rgb(234 235 228)"; 
    const areaLineColor = "rgb(97 99 92)";

    const tickWidth = 4;

    const messageTextColor = "rgb(20 20 20)";
    const messageFontFamily =
        "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";
    const messageFontSize = "1.0em ";
    const messageFontWeight = 700;

    const tickTextColor = "rgb(97 99 92)";
    const tickFontFamily =
        "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";
    const tickFontSize = "0.5em ";
    const tickFontWeight = 400;


    // const insertPoints = detailPoints.map((value, index) => (
    //     <circle
    //         key={index}
    //         cx={lp + pointOffset * index}
    //         // cy={(value / MaximumYAxis) * 100 * (ch / 100)}
    //         cy={ch - vp - (value / MaximumYAxis) * 100 * ((ch - vp - vp) / 100)}
    //         r="1"
    //         stroke={areaLineColor}
    //         strokeWidth="1"
        
    //     />
    // ));

    const insertPoints = detailPoints.map((value, index) => (
        <line
            key={index}
            x1={lp + index*((cw-lp-rp)/detailPoints.length)}
            y1={vp}
            x2={lp + index*((cw-lp-rp)/detailPoints.length)}
            y2={ch-vp}
            style={{
                stroke: 'rgb(40 40 40 / 0.05)',
                strokeWidth: borderStrokeWidth,
            }}
        
        />
    ));

    const ticks = [0, 1, 2, 3, 4];

    const yAxisTicks = ticks.map((value) => (
        <line
            key={value}
            x1={lp - tickWidth}
            y1={vp + ((ch - vp - vp) / (ticks.length - 1)) * value}
            x2={lp}
            y2={vp + ((ch - vp - vp) / (ticks.length - 1)) * value}
            style={{
                stroke: borderStrokeColor,
                strokeWidth: borderStrokeWidth,
            }}
        />
    ));

    const tickMax = (
        <text
            x={lp - tickWidth - 5}
            y={vp + 2}
            textAnchor="end"
            dominantBaseline="middle"
            fill={tickTextColor}
            fontFamily={tickFontFamily}
            fontWeight={tickFontWeight}
            fontSize={tickFontSize}
        >
            {Intl.NumberFormat("en-US", {
                notation: "compact",
                compactDisplay: "short",
            }).format(MaximumYAxis)}
        </text>
    );

    const tickMin = (
        <text
            x={lp - tickWidth - 5}
            y={ch - vp - 2}
            textAnchor="end"
            dominantBaseline="middle"        
            fill={tickTextColor}
            fontFamily={tickFontFamily}
            fontWeight={tickFontWeight}
            fontSize={tickFontSize}
        >
            0
        </text>
    );


    const perMessage = (
        <text
            x="-15"
            y={lp/2}
          
            textAnchor='end'
            dominantBaseline='middle'
            transform='rotate(270)'

            fill={tickTextColor}
            fontFamily={tickFontFamily}
            fontWeight={tickFontWeight}
            fontSize={tickFontSize}


        >
            per Mon.
        </text>
    );
   


    const noDataDisplayMessage = (
        <text
            x={cw / 2}
            y={ch / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={messageTextColor}
            fontFamily={messageFontFamily}
            fontWeight={messageFontWeight}
            fontSize={messageFontSize}
        >
            No Complaints For Period
        </text>
    );



    const areaChart = (
        <polygon
            points={
                lp +
                "," +
                (ch - vp) +
                " " +
                detailPoints
                    .map(
                        (value, index) =>
                            lp +
                            pointOffset * index +
                            "," +
                            (ch -
                                vp -
                                (value / MaximumYAxis) *
                                    100 *
                                    ((ch - vp - vp) / 100))
                    )
                    .join(" ") +
                " " +
                (cw - rp) +
                "," +
                (ch - vp)
            }
            style={{ fill: areaChartFill, strokeWidth: 0 }}
        />
    );

    const areaLine = (
        <polyline
            points={detailPoints
                .map(
                    (value, index) =>
                        lp +
                        pointOffset * index +
                        "," +
                        (ch -
                            vp -
                            (value / MaximumYAxis) *
                                100 *
                                ((ch - vp - vp) / 100))
                )
                .join(" ")}
            style={{ fill: "none", stroke: areaLineColor, strokeWidth: 1 }}
        />
    );


    return (
        <svg width={cw} height={ch}>

            {!maximumIsZero && areaChart}
    
            {!maximumIsZero && areaLine}
         
            {!maximumIsZero && yAxisTicks}

            {!maximumIsZero && insertPoints}
        
            <line
                x1={lp}
                y1={vp}
                x2={cw - rp}
                y2={vp}
                style={{
                    stroke: borderStrokeColor,
                    strokeWidth: borderStrokeWidth,
                }}
            />
            {/* right border */}
            <line
                x1={cw - rp}
                y1={vp}
                x2={cw - rp}
                y2={ch - vp}
                style={{
                    stroke: borderStrokeColor,
                    strokeWidth: borderStrokeWidth,
                }}
            />
            {/* bottom border */}
            <line
                x1={lp}
                y1={ch - rp}
                x2={cw - rp}
                y2={ch - vp}
                style={{
                    stroke: borderStrokeColor,
                    strokeWidth: borderStrokeWidth,
                }}
            />
            {/* left border */}
            <line
                x1={lp}
                y1={vp}
                x2={lp}
                y2={ch - rp}
                style={{
                    stroke: borderStrokeColor,
                    strokeWidth: borderStrokeWidth,
                }}
            />

            {maximumIsZero && noDataDisplayMessage}
            {!maximumIsZero && tickMax}
            {!maximumIsZero && tickMin}
        </svg>
    );
};

export default SvgSummaryChart;
