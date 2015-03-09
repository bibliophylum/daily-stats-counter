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

my $SQL = "select
 l.id as lid, l.library,
 t.id as tid, t.seq as tseq, t.name as tname,
 s.id as sid, s.seq as sseq, s.name as sname,
 sc.id as scid, sc.seq as scseq, sc.statistic, sc.explanation,
 d.ds, d.value
from
 tab t
 left join section s on s.tabid=t.id
 left join statcat sc on sc.secid=s.id
 left join daily d on d.statcatid=sc.id
 left join library l on l.id=d.libid
where
 l.id=?
 and d.ds=?
order by
 t.seq, s.seq, sc.seq
";

my $aref = $dbh->selectall_arrayref($SQL, { Slice => {} }, $lid, $ds );

if ((scalar @$aref) == 0) {
    # no existing daily data for that library and date
    $aref = $dbh->selectall_arrayref("select id from statcat");
    foreach my $row (@$aref) {
	$dbh->do("insert into daily (libid, ds, statcatid, value) values (?,?,?,0)",undef,$lid,$ds,$row->[0]) or die $dbh->errstr;
    }
    $aref = $dbh->selectall_arrayref($SQL, { Slice => {} }, $lid, $ds );
}

$dbh->disconnect;
print "Content-Type:application/json\n\n" . to_json( { dsc => $aref } );
