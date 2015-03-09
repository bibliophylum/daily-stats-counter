#!/usr/bin/perl -w
##
##  CGI-Application dsc (daily stats counter)
##
use strict;
use lib "/opt/fILL/modules";
use fILL::dsc;
my $app = fILL::dsc->new();
$app->run();
