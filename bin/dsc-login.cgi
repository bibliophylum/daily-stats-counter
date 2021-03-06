#!/usr/bin/perl

use CGI;
use DBI;
use JSON;
use Digest::MD5 qw(md5_hex);

my $query = new CGI;
my $u = $query->param('u');
my $p = $query->param('p');

my $dbfile = "/opt/dsc/database/dsc.db";
unless (-e $dbfile) {
    # need to run dsc-createdb.pl first, to create tables and load data
}

my $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","");

my $SQL = "select  l.id as lid from library l where l.library=? and l.password=?";
my $href = $dbh->selectrow_hashref($SQL, { Slice => {} }, $u, md5_hex($p) );

if (! defined $href) {
    $href->{lid} = 0;
    $href->{errmsg} = "No matching username/password.";
}

$dbh->disconnect;
print "Content-Type:application/json\n\n" . to_json( $href );
