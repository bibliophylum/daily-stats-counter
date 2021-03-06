// dsc.js
/*
    dsc: Daily Stats Counter - Free/Open-Source library stats tracking
    Copyright (C) 2015  Government of Manitoba

    dsc is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    dsc is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
//-------------------------------------------------------------------------
$('document').ready(function(){

    $("#login").on("submit",function(e){
	e.preventDefault();
	//alert("login submit");
	var parms = {
	    u: $("#username").val(),
	    p: $("#password").val()
	}
	console.dir(parms);
	$.getJSON('/cgi-bin/dsc-login.cgi', parms,
		  function(data){
		      //alert(data.lid);
		      if (data.lid != 0) {
			  $.cookie('dsc_lid', data.lid, { expires: 30, path: '/' });
			  $("#login").hide();
			  $(".content").show();
			  load_content();
		      } else {
			  $("#loginerror").text(data.errmsg);
		      }
		  })
	    .done(function() {
		//alert( "second success" );
	    })
	    .fail(function(data) {
		//alert( "error" );
		//console.dir(data);
	    })
	    .always(function() {
		//alert( "complete" );
	    });

    });

    $("#logout").on("submit",function(e){
	e.preventDefault();
	//alert("logout submit");
	$(".content").hide();
	$.removeCookie("dsc_lid");
	$("#login").show();
    });

    $('#thedate').change(function(){
	$("#waitDiv").show();
	$("#tabs").hide();
	$("#tabs").empty();
	load_content();  // will need to redo handlers...
	$("#tabs").tabs('refresh');
    });

    var d = new Date();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var today = d.getFullYear() + '-' +
        (month<10 ? '0' : '') + month + '-' +
        (day<10 ? '0' : '') + day;
    $("#thedate").val( today );

    $(function() {
	$( "#thedate" ).datepicker({
	    dateFormat: "yy-mm-dd",
	    onSelect: function(d,i){
		if(d !== i.lastVal){
		    $(this).change();
		}
	    }	
	});
    });

    if (! $.cookie('dsc_lid') ) {
        $("#login").show();
	$(".content").hide();

    } else {
	load_content();
    }
});

//-------------------------------------------------------------------------
function load_content() {
    var parms = {
	lid: $.cookie("dsc_lid"),
	ds: $("#thedate").val()
    }
    $.getJSON('/cgi-bin/dsc-getlist.cgi', parms,
	      function(data){
		  if ($("#tabs").is(':ui-tabs')) { 
		      // if we're a jquery-ui tab widget already, destroy it
		      // so it can be re-created with the new data.
		      $( "#tabs" ).tabs("destroy"); 
		  }
                  build_tables(data);
	      })
	.success(function() {
	    //alert('load_content success');
	    $("#tabs").tabs();
	    $("#waitDiv").hide();
	    $("#tabs").show();

	    $(".plus, .minus").off().on("click",function(e){
		e.preventDefault();
		update_value(this);
	    });

	    $('.entry').editable(function(value, settings) {
		update_value(this,value);
	    });
	})
	.error(function() {
	    //alert('error');
	})
	.complete(function() {
	    //alert('ajax complete');
	    /* Apply the jEditable handlers to the table */
	});
}

//-------------------------------------------------------------------------
function update_value( thisArg, value ){

    //alert($(thisArg).attr('id'));
    var res = $(thisArg).attr('id').split("_");
    //alert(res[0]+": "+res[1]);
    var isReplace = 0;
    var changeval = 0;
    var replaceval = value;
    if (res[0] === "plus") { changeval = 1 }
    else if (res[0] === "minus") { changeval = -1 }
    else { isReplace = 1 }
    
    // don't bother calling if the value would drop below zero...
    // hmm... if you quickly hit ".minus", you can get negative values
    //  which then can't be ".plus"-ed.  Seems like handler is firing
    //  before previous event is completed.
//    if (parseInt($("#value_"+res[1]).text()) + changeval >= 0) {
    var uparms;
    if (isReplace) {
	uparms = {
	    lid: $.cookie("dsc_lid"),
	    ds: $("#thedate").val(),
	    scid: res[1],
	    replace: replaceval
	};
    } else {
	uparms = {
	    lid: $.cookie("dsc_lid"),
	    ds: $("#thedate").val(),
	    scid: res[1],
	    change: changeval
	};
    }
    $.getJSON('/cgi-bin/dsc-update.cgi',uparms,
	      function(data){
		  if (data.ok != 0) {
		      $("#value_"+res[1]).text( data.newval );
		  }
	      }) 
	.done(function() {
	    //console.log( "second success" );
	})
	.fail(function(data) {
	    //console.log( "error" );
	    alert("Unable to update: "+data.error);
	})
	.always(function() {
	    //console.log( "complete" );
	});
//    }
    return replaceval; // used by .editable
}

//-------------------------------------------------------------------------
$.fn.exists = function () {
    return this.length !== 0;
}

//-------------------------------------------------------------------------
function build_tables( data ) {
    var $myDiv = $("#tabs");
    var $tabList = $("<ul />");
    var newDivs;
    for (var i=0;i<data.dsc.length;i++) {
	if ( ! $("#tabs-"+data.dsc[i].tid).exists() ) {
	    $tabList.append('<li><a href="#tabs-'+data.dsc[i].tid+'">'+data.dsc[i].tname+'</a></li>');
	    $myDiv.append('<div id="tabs-'+data.dsc[i].tid+'" />');
	}
    }
    $myDiv.prepend( $tabList );

    for (var i=0;i<data.dsc.length;i++) {
	if ( ! $("#dsc_"+data.dsc[i].tid+"_"+data.dsc[i].sid).exists() ) {
	    // a new table:
	    var $tbl = $('<table id="dsc_'+data.dsc[i].tid+"_"+data.dsc[i].sid+'" class="column" />');
	    $tbl.append("<thead><tr><th>"+data.dsc[i].sname+"</th><th>+</th><th>Count</th><th>-</th></tr></thead>");
	    $tbl.append("<tbody />");
	    $tbl.append('<tfoot><tr><td colspan="4"></td></tr></tfoot>');
	    $("#tabs-"+data.dsc[i].tid).append( $tbl );
	}
	$("#dsc_"+data.dsc[i].tid+"_"+data.dsc[i].sid+" > tbody").append('<tr><td><h3>'+data.dsc[i].statistic+'</h3><br>'+data.dsc[i].explanation+'</td><td id="plus_'+data.dsc[i].scid+'" class="plus"><img src="/img/Plus.png" /></td><td id="value_'+data.dsc[i].scid+'" class="entry">'+data.dsc[i].value+'</td><td id="minus_'+data.dsc[i].scid+'" class="minus"><img src="/img/Minus.png" /></td></tr>');
    }
}

