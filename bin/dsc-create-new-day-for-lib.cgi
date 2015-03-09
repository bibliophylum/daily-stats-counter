#!/usr/bin/perl

use CGI;
use DBI;
use JSON;

my $query = new CGI;
my $lid = $query->param('lid');
my $ds = $query->param('ds');
my $pass = $query->param('pass');

my $dbfile = "/opt/dsc/database/dsc.db";
unless (-e $dbfile) {
    # need to run dsc-createdb.pl first, to create tables and load data
}

my $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","");

my $SQL = "select libid, ds, statcatid, value from daily where libid=? and ds=?";
my $aref = $dbh->selectall_arrayref($SQL, { Slice => {} }, $lid, $ds );
if ((scalar @$aref) == 0) {
    # no existing daily data for that library and date
    $aref = $dbh->selectall_arrayref("select id from statcat");
    foreach my $row (@$aref) {
	$dbh->do("insert into daily (libid, ds, statcatid, value) values (?,?,?,0)",undef,$lid,$ds,$row->[0]) or die $dbh->errstr;
    }
}

$dbh->disconnect;
print "Content-Type:application/json\n\n" . to_json( { dsc => $aref } );
