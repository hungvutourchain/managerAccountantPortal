/**
 *  BootTree Treeview plugin for Bootstrap.
 *
 *  Based on BootSnipp TreeView Example by Sean Wessell
 *  URL:http://bootsnipp.com/snippets/featured/bootstrap-30-treeview
 *
 *Revised code by Leo "LeoV117" Myers
 *
 */
$.fn.extend({
    treed: function (o) {
        var openedClass = 'fa-chevron-down';
        var closedClass = 'fa-chevron-right';
        if (typeof o != 'undefined') {
            if (typeof o.openedClass != 'undefined') {
                openedClass = o.openedClass;
            }
            if (typeof o.closedClass != 'undefined') {
                closedClass = o.closedClass;
            }
        }
        ;
        //initialize each of the top levels
        var tree = $(this);
        tree.addClass("tree");
        tree.find('li').has("ul").each(function () {
            var branch = $(this); //li with children ul
            branch.prepend("<i style='color: red; font-weight: bold;' class='indicator fa " + closedClass + "'></i>");
            branch.addClass('branch');
            branch.on('click', function (e) {
                if (this == e.target) {
                    var icon = $(this).children('i:first');
                    icon.toggleClass(openedClass + " " + closedClass);
                    $(this).children().children().toggle();
                }
            });
            branch.children().children().toggle();
        });
        //fire event from the dynamically added icon
        tree.find('.branch .indicator').each(function () {
            $(this).on('click', function () {
                $(this).closest('li').click();
            });
        });
        //fire event to open branch if the li contains an anchor instead of text
        tree.find('.branch>a').each(function () {
            $(this).on('click', function (e) {
                $(this).closest('li').click();
                e.preventDefault();
            });
        });
        //fire event to open branch if the li contains a button instead of text
        tree.find('.branch>button').each(function () {
            $(this).on('click', function (e) {
                $(this).closest('li').click();
                e.preventDefault();
            });
        });
    }
});
$(document).ready(function () {
    // "All Features" button
    $('.prod-showprops').on('click', function () {
        if ($('.prod-tabs li a.active').attr('data-prodtab') == '#prod-tab-2') {
            $('html, body').animate({ scrollTop: ($('.prod-tabs-wrap').offset().top - 10) }, 700);
        }
        else {
            $('.prod-tabs li a').removeClass('active');
            $('#prod-props').addClass('active');
            $('.prod-tab-cont .prod-tab').css('height', '0px');
            $('#prod-tab-2').css('height', 'auto');
            $('html, body').animate({ scrollTop: ($('.prod-tabs-wrap').offset().top - 10) }, 700);
        }
        return false;
    });
    // Sidebar Categories
    $('#section-sb-toggle').on('click', function () {
        $('#section-sb-list').slideToggle();
        if ($(this).hasClass('opened'))
            $(this).removeClass("opened");
        else
            $(this).addClass('opened');
        return false;
    });
    $("#section-sb-list li.has_child").on("click", ".section-sb-toggle", function () {
        $(this).parent().next("ul").slideToggle();
        if ($(this).hasClass('opened'))
            $(this).removeClass("opened");
        else
            $(this).addClass('opened');
        return false;
    });
    // Filter Toggle (mobile)
    $('#section-filter-toggle').on('click', function () {
        $(this).next('.section-filter-cont').slideToggle();
        if ($(this).hasClass('opened')) {
            $(this).removeClass("opened").find('span').text($(this).data("open"));
        }
        else {
            $(this).addClass('opened').find('span').text($(this).data("close"));
        }
        return false;
    });
    // Product Offers (select type)
    $('body').on('click', '.offer-props-select p', function () {
        if ($(this).parent().hasClass('opened'))
            $(this).parent().removeClass('opened');
        else
            $(this).parent().addClass('opened');
        return false;
    });
    $('body').on('click', '.offer-props-select li', function () {
        if ($(this).parent().parent().hasClass('opened'))
            $(this).parent().parent().removeClass('opened');
        else
            $(this).parent().parent().addClass('opened');
    });
    $('body').on('click', '.offer-props-select li', function () {
        $(this).parent().parent().find('p').html($(this).text());
    });
    // setInterval(function () {
    //     var currentTime = new Date();
    //     var hours = currentTime.getHours();
    //     var minutes = currentTime.getMinutes();
    //     var seconds = currentTime.getSeconds();
    //     // Add leading zeros
    //     minutes = (minutes < 10 ? "0" : "") + minutes;
    //     seconds = (seconds < 10 ? "0" : "") + seconds;
    //     hours = (hours < 10 ? "0" : "") + hours;
    //     // Compose the string for display
    //     $(".hours").text(hours);
    //     $(".minutes").text(minutes);
    //     $(".seconds").text(seconds);
    // }, 1000);

    // $('#fontSize')
    // .bind('change', function(){ setFontSize($(this)); })
    // .bind('keyup', function(e){
    //   if (e.keyCode == 27) {
    //     $(this).val('1');
    //     $('body').css({ fontSize: '1em' });  
    //   } else {
    //     setFontSize($(this));
    //   }
    // });
  
    // $(window)
    //     .bind('keyup', function(e){
    //     if (e.keyCode == 27) {
    //         $('#fontSize').val('1');
    //         $('body').css({ fontSize: '1em' });  
    //     }
    //     });
});
function toggleById(id) {
    $('#' + id).toggle();
};
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
  function setFontSize(el) {
      var fontSize = el.val();
      
      if ( isNumber(fontSize) && fontSize >= 0.5 ) {
        $('body').css({ fontSize: fontSize + 'em' });
      } else if ( fontSize ) {
        el.val('1');
        $('body').css({ fontSize: '1em' });  
      }
  }
  
function ConvertDateTimeToString_vx(time) {
    // "DateGroup" : "31 Dec, 2016 - 30 Oct, 2017",
    var monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var t = new Date(time);
    var d = t.getDate() < 10 ? "0" + t.getDate() : t.getDate();
    return d + '-' + monthShortNames[(t.getMonth())] + '-' + t.getFullYear();
}
;
var nameExportHote;
function ExportDataHotel() {
    var blob = new Blob([document.getElementById('exportContract').innerHTML], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
    });
    saveAs(blob, nameExportHote + '.xls');
}
function ExportDataExcell() {
    var blob = new Blob([document.getElementById('view-Export').innerHTML], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
    });
    saveAs(blob, 'Export' + ConvertDateTimeToString_vx(new Date()) + '.xls');
    $('.loading').addClass('hide');
}
function CheckBrowse() {
    if (navigator.userAgent.indexOf('Mac') > 1) {
        if (isSafari()) {
            alert('This function is worked properly on Browses of Chrome,\n Firefox and Edge. Please try it again on those platforms.\n \t\t\t Thank you for your patience. \n\n \t\t\t ▬▬▬▬▬▬▬▬▬ஜ۩۞۩ஜ▬▬▬▬▬▬▬▬▬\n\n');
        }
        else {
            ExportDataExcell();
        }
    }
    else {
        ExportDataExcell();
    }
}
function PrinterCheck() {
    var printContents = document.getElementById('container').innerHTML;
    var myWindow = window.open('', '_blank');
    myWindow.document.write(printContents);
    myWindow.document.close();
    myWindow.focus();
    myWindow.print();
    myWindow.close();
};