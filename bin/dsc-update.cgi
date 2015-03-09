#!/usr/bin/perl

use CGI;
use DBI;
use JSON;

my $query = new CGI;
my $lid = $query->param('lid');
my $ds = $query->param('ds');
my $scid = $query->param('scid');
my $valueChange = $query->param('change');
my $valueReplace = $query->param('replace');

my $SQL;
my $newvalue;
if (defined $valueChange) {
    $SQL = "update daily set value=value+? where libid=? and ds=? and statcatid=?";
    $newvalue = $valueChange;
} elsif (defined $valueReplace) {
    $SQL = "update daily set value=? where libid=? and ds=? and statcatid=?";
    $newvalue = $valueReplace;
} else {
    print "Content-Type:application/json\n\n" . to_json( { ok => 0 } );
    exit 0;
}

my $dbfile = "/opt/dsc/database/dsc.db";
unless (-e $dbfile) {
    # need to run dsc-createdb.pl first, to create tables and load data
}

my $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","") or die "Can't connect to database: $DBI::errstr";

my $ok = $dbh->do($SQL, undef, $newvalue, $lid, $ds, $scid );
my $newval;
my $errstr;
if (not defined $ok) {
    # no matching row to update
    $ok = 0;
    $newval = -999;
    $errstr = $DBI::errstr;
} else {
    my $aref = $dbh->selectrow_arrayref("select value from daily where libid=? and ds=? and statcatid=?", undef, $lid, $ds, $scid);
    $newval = $aref->[0];
}

$dbh->disconnect;
print "Content-Type:application/json\n\n" . to_json( { ok => $ok, newval => $newval, error => $errstr } );
