

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


var padLeft = function(str, pad, size) {
  while (str.length < size) {
    str = pad + str;
  }
  return str;
};

var getDateString = function(date) {
  return date.getFullYear() + "-" 
    + padLeft(String(date.getUTCMonth() + 1), "0", 2) + "-"
    + padLeft(String(date.getUTCDate()), "0", 2);
};

var getISODateString = function(date) {
  return getDateString(date) + "T";
};

var getISODateTimeString = function(date) {
  return getISODateString(date)
    + padLeft(String(date.getUTCHours()), "0", 2) + ":"
    + padLeft(String(date.getUTCMinutes()), "0", 2) + ":"
    + padLeft(String(date.getUTCSeconds()), "0", 2) + "."
    + padLeft(String(date.getUTCMilliseconds()), "0", 3) + "Z";
};

var getISOTimeString = function(date) {
  return padLeft(String(date.getUTCHours()), "0", 2) + ":"
    + padLeft(String(date.getUTCMinutes()), "0", 2) + ":"
    + padLeft(String(date.getUTCSeconds()), "0", 2) + "."
    + padLeft(String(date.getUTCMilliseconds()), "0", 3);
};

var htmlTemplate = function(selector, values) {
  var tmplString = $(selector).html();
  return _.template(tmplString, values);
};

var isValidTime = function(time){
 
  // offset is the one after the first.
  var firstColonPos = time.indexOf(':');
  var secondColonPos = time.indexOf(':', firstColonPos + 1);
  var millisecondsPointPos = time.indexOf('.');
  

  if (firstColonPos!=2 || secondColonPos!=5 || millisecondsPointPos!=8){
    return false;
  }

  var t = time.split(':');
  var h = t[0];
  var m = t[1];
  var s = t[2].split('.')[0];
  var ms = t[2].split('.')[1];
  if(isNaN(h) || isNaN(m) || isNaN(s) || isNaN(ms)){
    return false;
  }

  return true;

};

var parseTime = function(time){
  
  // offset is the one after the first.
  var firstColonPos = time.indexOf(':');
  var secondColonPos = time.indexOf(':', firstColonPos + 1);
  var millisecondsPointPos = time.indexOf('.');
  
  if (firstColonPos!=2 || secondColonPos!=5 || millisecondsPointPos!=8){
    return false;
  }

  var t = time.split(':');
  var h = t[0];
  var m = t[1];
  var s = t[2].split('.')[0];
  var ms = t[2].split('.')[1];
  if(isNaN(h) || isNaN(m) || isNaN(s) || isNaN(ms)){
    return false;
  }

  return [Number(h),Number(m),Number(s),Number(ms)];

};

var utc = function(year, month, day, hours, minutes, seconds, milliseconds) {
  var date = new Date(Date.UTC.apply(null, arguments));
  return date;
};

// TODO: move this to libcoverage.js
var getCoverageXML = function(coverageid, options) {
  if (!coverageid) {
      throw new Error("Parameters 'coverageid' is mandatory.");
  }
  options = options || {};
  subsetCRS = options.subsetCRS || "http://www.opengis.net/def/crs/EPSG/0/4326";
  var params = [
    '<wcs:GetCoverage service="WCS" version="2.0.0" xmlns:wcs="http://www.opengis.net/wcs/2.0" xmlns:wcscrs="http://www.opengis.net/wcs/crs/1.0" xmlns:wcsmask="http://www.opengis.net/wcs/mask/1.0">',
    '<wcs:CoverageId>' + coverageid + '</wcs:CoverageId>',
  ], extension = [];

  if (options.format)
    params.push("<wcs:format>" + options.format + "</wcs:format>");
  if (options.bbox && !options.subsetX && !options.subsetY) {
    options.subsetX = [options.bbox[0], options.bbox[2]];
    options.subsetY = [options.bbox[1], options.bbox[3]];
  }
  if (options.subsetX) {
    params.push('<wcs:DimensionTrim><wcs:Dimension crs="' + subsetCRS + '">x</wcs:Dimension>' +
                "<wcs:TrimLow>" + options.subsetX[0] + "</wcs:TrimLow>" +
                "<wcs:TrimHigh>" + options.subsetX[1] + "</wcs:TrimHigh></wcs:DimensionTrim>");
  }
  if (options.subsetY) {
    params.push('<wcs:DimensionTrim><wcs:Dimension crs="' + subsetCRS + '">y</wcs:Dimension>' +
                "<wcs:TrimLow>" + options.subsetY[0] + "</wcs:TrimLow>" +
                "<wcs:TrimHigh>" + options.subsetY[1] + "</wcs:TrimHigh></wcs:DimensionTrim>");
  }
  
  if (options.outputCRS) {
    /* the crs extension is not released. Mapserver expects a <wcs:OutputCRS> 
     * in the root. Will stick to that atm, but requires a change in the future.
    */
    //extension.push("<wcscrs:outputCrs>" + options.outputCRS + "</wcscrs:outputCrs>");
    params.push("<wcs:OutputCrs>" + options.outputCRS + "</wcs:OutputCrs>");
  }

  // raises an exception in MapServer
  //extension.push("<wcscrs:subsettingCrs>" + subsetCRS + "</wcscrs:subsettingCrs>");
  
  if (options.mask) {
    extension.push("<wcsmask:polygonMask>" + options.mask + "</wcsmask:polygonMask>");
  }
  if (options.multipart) {
    params.push("<wcs:mediaType>multipart/related</wcs:mediaType>");
  }

  if (extension.length > 0) {
    params.push("<wcs:Extension>");
    for(var i = 0; i < extension.length; ++i) {
      params.push(extension[i]);
    }
    params.push("</wcs:Extension>");
  }
  params.push('</wcs:GetCoverage>');
  return params.join("");
};

var showMessage = function(level, message, timeout, additionalClasses){
  var label = level.capitalizeFirstLetter();
  if (label === 'Danger'){label = 'Error';}
  if(label === 'Success'){label = 'Info';}
  var el = $(
    '<div style="padding-right:40px;" class="alert alert-'+level+' '+additionalClasses+'">'+
      '<button style="margin-right:-25px;" type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
      '<svg id="countdowncircle" width="10" height="10" viewbox="0 0 10 10"><path id="loader" transform="translate(5, 5)" /></svg>'+
      '<strong>'+label+'</strong>:<br/> '+ message  +
    '</div>'
  );

  $("#error-messages").append(el);

  var $loader = $('#loader'),
    alpha = 360,
    pi = Math.PI,
    time = timeout;

  function draw() {
    alpha--;

    var r = ( alpha * pi / 180 ),
      x = Math.sin( r ) * 5,
      y = Math.cos( r ) * - 5,
      mid = ( alpha <= 180 ) ? 0 : 1,
      animate = 'M 0 0 v -5 A 5 5 1 ' 
             + mid + ' 1 ' 
             +  x  + ' ' 
             +  y  + ' z';
   
      if (alpha > 0){
        setTimeout(draw, time); // Redraw
        el.find('path')[0].setAttribute('d', animate);
        //loader.setAttribute( 'd', animate );
      }else{
        el.remove();
      }
  };

  draw.call(el);
}


var rgbToHex = function (rgb) { 
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};

var fullColorHex = function(r,g,b) {   
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return '#'+red+green+blue;
};

var getColorList = function(list){
    var positions = [];
    var colors = [];
    var stepsize = 1/(list.length-1);
    var pos = 0;
    for (var i = 0; i < list.length; i++) {
        var vals = list[i].map(function(v){return Math.floor(v*255);})
        colors.push(fullColorHex.apply(this,vals));
        positions.push(pos);
        pos+=stepsize;
        pos = +(pos.toFixed(4));
    }
    return [colors, positions];
}

var RdYlBu = [
    [0.6470588235294118 , 0.0                 , 0.14901960784313725],
    [0.84313725490196079, 0.18823529411764706 , 0.15294117647058825],
    [0.95686274509803926, 0.42745098039215684 , 0.2627450980392157 ],
    [0.99215686274509807, 0.68235294117647061 , 0.38039215686274508],
    [0.99607843137254903, 0.8784313725490196  , 0.56470588235294117],
    [1.0                , 1.0                 , 0.74901960784313726],
    [0.8784313725490196 , 0.95294117647058818 , 0.97254901960784312],
    [0.6705882352941176 , 0.85098039215686272 , 0.9137254901960784 ],
    [0.45490196078431372, 0.67843137254901964 , 0.81960784313725488],
    [0.27058823529411763, 0.45882352941176469 , 0.70588235294117652],
    [0.19215686274509805, 0.21176470588235294 , 0.58431372549019611]
];

var csdef = getColorList(RdYlBu);


var additionalColorscales = {
  'rdylbu': csdef,
  'blackwhite': [['#000000', '#ffffff'], [0, 1]],
  'redwhiteblue': [['#ff0000', '#ffffff', '#0000ff'], [0, 0.5, 1]],
  'redblue': [['#ff0000', '#0000ff'], [0, 1]],
  'coolwarm': [['#ff0000', '#ffffff', '#0000ff'], [0, 0.5, 1]],
  'diverging_1': [
      ['#400040','#3b004d','#36005b','#320068','#2d0076','#290084',
       '#240091','#20009f','#1b00ad','#1600ba','#1200c8','#0d00d6',
       '#0900e3','#0400f1','#0000ff','#0217ff','#042eff','#0645ff',
       '#095cff','#0b73ff','#0d8bff','#10a2ff','#12b9ff','#14d0ff',
       '#17e7ff','#19ffff','#3fffff','#66ffff','#8cffff','#b2ffff',
       '#d8ffff','#ffffff','#ffffd4','#ffffaa','#ffff7f','#ffff54',
       '#ffff2a','#ffff00','#ffed00','#ffdd00','#ffcc00','#ffba00',
       '#ffaa00','#ff9900','#ff8700','#ff7700','#ff6600','#ff5400',
       '#ff4400','#ff3300','#ff2100','#ff1100','#ff0000','#ff0017',
       '#ff002e','#ff0045','#ff005c','#ff0073','#ff008b','#ff00a2',
       '#ff00b9','#ff00d0','#ff00e7','#ff00ff'],
       [0.0,0.01587301587,0.03174603174,0.04761904761,0.06349206348,
        0.07936507935,0.09523809522,0.11111111109,0.12698412696,
        0.14285714283,0.15873015870,0.17460317457,0.19047619044,
        0.20634920631,0.22222222218,0.23809523805,0.25396825392,
        0.26984126979,0.28571428566,0.30158730153,0.31746031740,
        0.33333333327,0.34920634914,0.36507936501,0.38095238088,
        0.39682539675,0.41269841262,0.42857142849,0.44444444436,
        0.46031746023,0.47619047610,0.49206349197,0.50793650784,
        0.52380952371,0.53968253958,0.55555555545,0.57142857132,
        0.58730158719,0.60317460306,0.61904761893,0.63492063480,
        0.65079365067,0.66666666654,0.68253968241,0.69841269828,
        0.71428571415,0.73015873002,0.74603174589,0.76190476176,
        0.77777777763,0.79365079350,0.80952380937,0.82539682524,
        0.84126984111,0.85714285698,0.87301587285,0.88888888872,
        0.90476190459,0.92063492046,0.93650793633,0.95238095220,
        0.96825396807,0.98412698394,1]
    ],
    'diverging_2': [
        ['#000000', '#030aff', '#204aff', '#3c8aff', '#77c4ff',
         '#f0ffff', '#f0ffff', '#f2ff7f', '#ffff00', '#ff831e',
         '#ff083d', '#ff00ff'],
        [0, 0.0000000001, 0.1, 0.2, 0.3333, 0.4666, 0.5333, 0.6666,
         0.8, 0.9, 0.999999999999, 1]
    ],
    'redwhitered': [['#a90326', '#ffffff', '#a90326'], [0, 0.5, 1]],
    'bluewhiteblue': [['#35439b', '#ffffff', '#35439b'], [0, 0.5, 1]],
};



var isObject= function (obj) {
  var type = typeof obj;
  return !Array.isArray(obj) && (type === 'function' || type === 'object' && !!obj);
}

var iterationCopy = function (src) {
  return JSON.parse(JSON.stringify(src));
}