/**
 * Cavin.js
 * Computer Vision and Image Processing Library for HTML5 Canvas
 * author @wellflat http://rest-term.com
 */
(function() {
  /**
   * initialize
   */
  var Cavin;            // top-level namespace
  var _root = this;     // reference to 'window' or 'global'
  var _ctx = null;      // local reference to CanvasRenderingContext2D
  var _imgdata = null;  // local reference to ImageData

  // local reference to slice/splice
  var slice = Array.prototype.slice,
      splice = Array.prototype.splice;

  if(typeof exports !== 'undefined') {
    Cavin = exports;    // for CommonJS
  } else {
    Cavin = _root.Cavin = {};
  }

  // current version of the library
  Cavin.version = {
    release: '0.1.2',
    date: '2012-03'
  };
  Cavin.toString = function() {
    return "version " + Cavin.version.release + ", released " + Cavin.version.date;
  };

  // set the js library that will be used for DOM manipulation,
  // by default will use jQuery
  var $ = _root.jQuery;
  Cavin.setDomLibrary = function(lib) {
    $ = lib;
  };

  /**
   * Image I/O modules
   */
  Cavin.IO = {
    read: function() {
      var args = slice.call(arguments),
          img = new Image(),
          opt = Cavin.IO._parseOpt(args);
      img.src = opt['path'];
      _ctx = document.createElement('canvas').getContext('2d');
      img.addEventListener('load', function(e) {
        _ctx.canvas.width = img.width;
        _ctx.canvas.height = img.height;
        _ctx.drawImage(img, 0, 0);
        _imgdata = _ctx.getImageData(0, 0, img.width, img.height);
        opt['success'](_imgdata);
      }, false);
      img.addEventListener('error', function(e) {
        opt['error']('can\'t load image: ' + opt['path']);
      }, false);
    },
    write: function(data, target) {
      var ctx;
      if(typeof target === 'string') {
        ctx = document.querySelector(target).getContext('2d');
      } else if(typeof target === 'object') {
        ctx = target;  // CanvasRenderingContext2D
      }
      ctx.putImageData(data, 0, 0);
    },
    getImageData: function(context) {
      var w = context.canvas.width,
          h = context.canvas.height;
      return context.getImageData(0, 0, w, h);
    },
    _parseOpt: function(args) {
      var opt = {};
      // {path:string, success:function, error:function}
      if(args.length === 1 && typeof args[0] === 'object') {
        if(typeof args[0]['path'] !== 'string') {
          throw new Error('string object required: path');
        } else {
          opt['path'] = args[0]['path'];
        }
        if(typeof args[0]['success'] != 'function') {
          throw new Error('function object required: success');
        } else {
          opt['success'] = args[0]['success'];
        }
        if(typeof args[0]['error'] != 'function') {
          throw new Error('function object required: error');
        } else {
          opt['error'] = args[0]['error'];
        }
      }
      // path, callback
      if(args.length === 2 && typeof args[0] === 'string') {
        opt['path'] = args[0];
        if(typeof args[1] != 'function') {
          throw new Error('function object required');
        } else {
          opt['success'] = args[1];
        }
      }
      return opt;
    }
  };
  // aliases
  Cavin.get = Cavin.IO.read;
  Cavin.put = Cavin.IO.write;

  /**
   * Image filter modules
   */
  Cavin.Filter = {
    /* convolution filter (n*n squire kernel) */
    convolution: function(data, kernel, divisor, bias) {
      var srcimg = data,
          w = srcimg.width,
          h = srcimg.height,
          srcdata = srcimg.data,
          dstimg = _ctx.createImageData(w, h),
          dstdata = dstimg.data,
          div = 1/divisor,
          r = Math.sqrt(kernel.length),
          buff = [0, 0, 0],
          i, j, k, v, px, py, step, kstep;
      if(divisor === 0) {
        throw new Error('division zero');
      }
      if(r%2 !== 1) {
        throw new Error('square kernel required');
      }
      r = (r - 1)/2;
      for(var y=0; y<h; y++) {
        step = y*w;
        for(var x=0; x<w; x++) {
          buff[0] = buff[1] = buff[2] = 0;
          i = (step + x) << 2;
          k = 0;
          // convolution
          for(var ky=-r; ky<=r; ky++) {
            py = y + ky;
            if(py <= 0 || h <= py) py = y;
            kstep = py*w;
            for(var kx=-r; kx<=r; kx++) {
              px = x + kx;
              if(px <= 0 || w <= px) px = x;
              j = (kstep << 2) + (px << 2);
              buff[0] += srcdata[j]*kernel[k];
              buff[1] += srcdata[j + 1]*kernel[k];
              buff[2] += srcdata[j + 2]*kernel[k];
              k++;
            }
          }
          // saturation (for Opera)
          v = buff[0]*div + bias;
          dstdata[i] = v < 0 ? 0 : v > 255 ? 255 : v;
          v = buff[1]*div + bias;
          dstdata[i + 1] = v < 0 ? 0 : v > 255 ? 255 : v;
          v = buff[2]*div + bias;
          dstdata[i + 2] = v < 0 ? 0 : v > 255 ? 255 : v;
          dstdata[i + 3] = 255;
        }
      }
      return dstimg;
    },
    /* box blur filter */
    blur: function(data, radius) {
      var kernel = [],
          size = (2*radius + 1)*(2*radius + 1);
      for(var i=0; i<size; i++) {
        kernel[i] = 1;
      }
      return Cavin.Filter.convolution(data, kernel, size, 0);
    },
    /* gaussian blur filter */
    gaussian: function(data, radius) {
      var kernel = [],
          size = (2*radius + 1)*(2*radius + 1),
          sigma = 0.849321800288,
          k = 1.0/Math.sqrt(2.0*Math.PI)/sigma,
          a = 0.0, f = 0;
      for(var y=-radius; y<=radius; y++) {
        for(var x=-radius; x<=radius; x++) {
          f = k*Math.exp(-(x*x + y*y)/(2*sigma*sigma));
          kernel.push(f);
          a += f;
        }
      }
      for(var i=0; i<kernel.length; i++) {
        kernel[i] /= a;
      }
      return Cavin.Filter.convolution(data, kernel, 1, 0);
    },
    /* canny edge detector filter */
    canny: function(data, threshold1, threshold2) {
      var srcimg = data,
          width = data.width,
          height = data.height,
          step = width << 2,
          magbuf = [],
          ret, dx, dy, dxdata, dydata, cx, cy, i;
      ret = Cavin.Filter.gaussian(data, 2);
      dx = Cavin.Filter.convolution(ret, [-1,0,1,-2,0,2,-1,0,1], 1, 0);
      dy = Cavin.Filter.convolution(ret, [-1,-2,-1,0,0,0,1,2,1], 1, 0);
      dxdata = dx.data;
      dydata = dy.data;
      for(var y=0; y<height; y++) {
        for(var x=0; x<width; x++) {
          i = y*step + (x << 2);
          cx = dxdata[i];
          cy = dydata[i];
        }
      }
      throw new Error('implementation pending ...');
    },
    /* jitter filter */
    jitter: function(data, amount) {
      var srcimg = data,
          w = srcimg.width,
          h = srcimg.height,
          srcdata = srcimg.data,
          dstimg = _ctx.createImageData(w, h),
          dstdata = dstimg.data,
          dx, dy, i, k, step;
      for(var y=0; y<h; y++) {
        step = y*w;
        for(var x=0; x<w; x++) {
          dx = x + Math.round((Math.random() - 0.5)*amount);
          dy = y + Math.round((Math.random() - 0.5)*amount);
          i = (step + x) << 2;
          k = (w*dy + dx) << 2;
          dstdata[i] = srcdata[k];
          dstdata[i + 1] = srcdata[k + 1];
          dstdata[i + 2] = srcdata[k + 2];
          dstdata[i + 3] = 255;
        }
      }
      return dstimg;
    },
    /* symmetric nearest neighbor filter */
    snn: function(data, radius) {
      var srcimg = data,
          w = srcimg.width,
          h = srcimg.height,
          r = parseInt(radius),
          div = 1.0/((2*r + 1)*(2*r + 1)),
          srcdata = srcimg.data,
          dstimg = _ctx.createImageData(w, h),
          dstdata = dstimg.data,
          sumr, sumg, sumb,
          rc, gc, bc, r1, g1, b1, r2, g2, b2,
          pv, pu, xystep, uvstep, delta1, delta2,
          i, j;
      for(var y=0; y<h; y++) {
        xystep = y*w;
        for(var x=0; x<w; x++) {
          i = (xystep + x) << 2;
          sumr = 0, sumg = 0, sumb = 0;
          rc = srcdata[i];
          gc = srcdata[i + 1];
          bc = srcdata[i + 2];
          for(var v=-r; v<=r; v++) {
            uvstep = w*v;
            for(var u=-r; u<=r; u++) {
              j = (uvstep + u) << 2;
              if(srcdata[i + j]) {
                r1 = srcdata[i + j];
                g1 = srcdata[i + j + 1];
                b1 = srcdata[i + j + 2];
              } else {
                r1 = srcdata[i];
                g1 = srcdata[i + 1];
                b1 = srcdata[i + 2];
              }
              if(srcdata[i - j]) {
                r2 = srcdata[i - j];
                g2 = srcdata[i - j + 1];
                b2 = srcdata[i - j + 2];
              } else {
                r2 = srcdata[i];
                g2 = srcdata[i + 1];
                b2 = srcdata[i + 2];
              }
              delta1 = Math.sqrt((rc - r1)*(rc - r1) +
                                 (gc - g1)*(gc - g1) +
                                 (bc - b1)*(bc - b1));
              delta2 = Math.sqrt((rc - r2)*(rc - r2) +
                                 (gc - g2)*(gc - g2) +
                                 (bc - b2)*(bc - b2));
              if(delta1 < delta2) {
                sumr += r1;
                sumg += g1;
                sumb += b1;
              } else {
                sumr += r2;
                sumg += g2;
                sumb += b2;
              }
            }
          }
          dstdata[i] = sumr*div;
          dstdata[i + 1] = sumg*div;
          dstdata[i + 2] = sumb*div;
          dstdata[i + 3] = 255;
        }
      }
      return dstimg;
    }
  };

  /**
   * Image processing modules
   */
  Cavin.Proc = {};
  Cavin.Proc.FFT = {
    init: function(n) {
      // todo: import from fft.js
    }
  };
  Cavin.Proc.Hough = {
    init: function() {
      // todo: import from hough.js
    }
  };

  /**
   * 2D-features detection modules
   */
  Cavin.Features2D = {
    hlac: function() {
      // todo: import from cvsandbox.js
    },
    orb: function() {
      // todo: implement
    },
    star: function() {
      // todo: implement
    }
  };

  /**
   * Utilities modules
   */
  Cavin.Util = {
    hex2rgb: function(hex) {
      var r, g, b;
      if(hex.charAt(0) === "#") hex = hex.substr(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
      return {r: r, g: g, b: b};
    }
  };
}).call(this);