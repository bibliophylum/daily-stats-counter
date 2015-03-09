#!/usr/bin/perl
use strict;
use warnings;
use DBI;
use Text::CSV;
use Digest::MD5 qw(md5_hex);

# set some paths
my $csvFile = "/opt/dsc/libs.csv";
my $sqlitedb = "/opt/dsc/database/dsc.db";

# read the csv file of stats to gather
my @rows;
my $csv = Text::CSV->new ( { binary => 1 } )  # should set binary attribute.
    or die "Cannot use CSV: ".Text::CSV->error_diag ();

open my $fh, "<:encoding(utf8)", $csvFile or die "$csvFile: $!";
while ( my $row = $csv->getline( $fh ) ) {
    #$row->[2] =~ m/pattern/ or next; # 3rd field should match
    push @rows, $row;
}
$csv->eof or $csv->error_diag();
close $fh;


# connect to the db 
my $dbh = DBI->connect("dbi:SQLite:dbname=$sqlitedb","","");

# this is what the "create the tables" line looks like, from dsc-createdb.pl:
#$dbh->do("create table library (id smallint, library text, password text)") or die $dbh->errstr;

# build sql statements from csv
for my $i (0 .. $#rows) {
    print "loading " . $rows[$i]->[0] . ": " . $rows[$i]->[1] . "\n";
    $dbh->do("insert into library (id, library, password) values (?,?,?)",undef,$rows[$i]->[0],$rows[$i]->[1],md5_hex($rows[$i]->[2])) or die $dbh->errstr;
}

$dbh->close();
